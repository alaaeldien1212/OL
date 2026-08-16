-- Strip answer keys from student-facing form payloads, and require keys when
-- a form's questions are created or changed. Existing rows are not rewritten.

CREATE OR REPLACE FUNCTION public.strip_form_question_answer_keys(questions jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN questions IS NULL OR jsonb_typeof(questions) <> 'array' THEN '[]'::jsonb
    ELSE COALESCE(
      (
        SELECT jsonb_agg(
          CASE
            WHEN jsonb_typeof(elem.question) = 'object' THEN (elem.question - 'correct_answer')
            ELSE elem.question
          END
          ORDER BY elem.ordinality
        )
        FROM jsonb_array_elements(questions) WITH ORDINALITY AS elem(question, ordinality)
      ),
      '[]'::jsonb
    )
  END;
$function$;

REVOKE ALL ON FUNCTION public.strip_form_question_answer_keys(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.strip_form_question_answer_keys(jsonb) TO service_role;

DROP FUNCTION IF EXISTS public.student_get_form_template(text, uuid);

CREATE FUNCTION public.student_get_form_template(
  student_access_code text,
  story_uuid uuid
)
RETURNS TABLE(
  id uuid,
  story_id uuid,
  title_arabic text,
  description_arabic text,
  questions jsonb,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  student_record public.students%ROWTYPE;
BEGIN
  SELECT s.*
  INTO student_record
  FROM public.students AS s
  WHERE s.access_code = TRIM(student_access_code)
    AND (s.is_registered = true OR s.name IS NOT NULL);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found or not registered';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.stories AS st
    WHERE st.id = story_uuid
      AND st.is_active = true
      AND EXISTS (
        SELECT 1
        FROM public.student_classrooms AS sc
        JOIN public.classrooms AS c ON c.id = sc.classroom_id
        LEFT JOIN public.teachers AS t ON t.id = c.teacher_id
        WHERE sc.student_id = student_record.id
          AND c.is_active = true
          AND (c.teacher_id IS NULL OR t.is_active = true)
          AND c.grade = st.grade_level
      )
  ) THEN
    RAISE EXCEPTION 'Story not found or not accessible for the student';
  END IF;

  RETURN QUERY
  SELECT
    ft.id,
    ft.story_id,
    ft.title_arabic,
    ft.description_arabic,
    public.strip_form_question_answer_keys(ft.questions),
    ft.is_active
  FROM public.form_templates AS ft
  WHERE ft.story_id = story_uuid
    AND ft.is_active = true
  ORDER BY ft.created_at DESC
  LIMIT 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.student_get_form_template(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.student_get_form_template(text, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_form_question_answer_keys()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  question jsonb;
  answer text;
  option_text text;
  has_matching_option boolean;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.questions IS NOT DISTINCT FROM OLD.questions THEN
    RETURN NEW;
  END IF;

  IF NEW.questions IS NULL OR jsonb_typeof(NEW.questions) <> 'array' THEN
    RAISE EXCEPTION 'Form questions must be a JSON array';
  END IF;

  IF jsonb_array_length(NEW.questions) = 0 THEN
    RETURN NEW;
  END IF;

  FOR question IN
    SELECT value FROM jsonb_array_elements(NEW.questions)
  LOOP
    answer := NULLIF(btrim(COALESCE(question ->> 'correct_answer', '')), '');
    IF answer IS NULL THEN
      RAISE EXCEPTION 'كل سؤال يحتاج إلى إجابة صحيحة قبل حفظ النموذج';
    END IF;

    IF COALESCE(question ->> 'type', '') = 'multiple_choice' THEN
      has_matching_option := false;
      FOR option_text IN
        SELECT btrim(value)
        FROM jsonb_array_elements_text(COALESCE(question -> 'options', '[]'::jsonb))
      LOOP
        IF option_text = answer THEN
          has_matching_option := true;
          EXIT;
        END IF;
      END LOOP;

      IF NOT has_matching_option THEN
        RAISE EXCEPTION 'الإجابة الصحيحة يجب أن تطابق أحد خيارات السؤال';
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_form_question_answer_keys ON public.form_templates;
CREATE TRIGGER enforce_form_question_answer_keys
BEFORE INSERT OR UPDATE OF questions ON public.form_templates
FOR EACH ROW
EXECUTE PROCEDURE public.enforce_form_question_answer_keys();
