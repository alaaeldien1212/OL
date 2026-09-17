-- Rotate the shared secret used to authorize the secure grading Edge Function.
-- The companion JS constant (supabase/functions/secure-auto-grading/index.ts)
-- must match this hash. The old hash e4eba8... is being abandoned; the plaintext
-- secret is only ever known to the Vercel runtime and this one SHA-256 value.

CREATE OR REPLACE FUNCTION public.server_submit_auto_graded_form(
  student_access_code text,
  story_uuid uuid,
  form_template_uuid uuid,
  form_responses jsonb,
  grade_value integer,
  feedback_value text,
  authorization_token text,
  audio_url text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid,
  student_id uuid,
  story_id uuid,
  form_template_id uuid,
  responses jsonb,
  submitted_at timestamp with time zone,
  status text,
  grade integer,
  feedback text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  student_record public.students%ROWTYPE;
  submission_id uuid;
BEGIN
  IF authorization_token IS NULL
    OR encode(extensions.digest(authorization_token, 'sha256'), 'hex') <> 'e5e6516459ecfaf72abe99facc56a27e98fb53b9fdc1812918dd35e482ceabf0'
  THEN
    RAISE EXCEPTION 'Unauthorized auto-grading request';
  END IF;

  IF grade_value IS NULL OR grade_value < 0 OR grade_value > 100 THEN
    RAISE EXCEPTION 'Grade must be between 0 and 100';
  END IF;

  IF feedback_value IS NULL
    OR TRIM(feedback_value) = ''
    OR char_length(feedback_value) > 4000
  THEN
    RAISE EXCEPTION 'Auto-grading feedback is invalid';
  END IF;

  IF form_responses IS NULL OR jsonb_typeof(form_responses) <> 'object' THEN
    RAISE EXCEPTION 'Form responses must be a JSON object';
  END IF;

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

  IF NOT EXISTS (
    SELECT 1
    FROM public.form_templates AS ft
    WHERE ft.id = form_template_uuid
      AND ft.story_id = story_uuid
      AND ft.is_active = true
  ) THEN
    RAISE EXCEPTION 'Form template not found or not active';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.form_templates AS ft
    CROSS JOIN LATERAL jsonb_array_elements(ft.questions) AS question
    WHERE ft.id = form_template_uuid
      AND COALESCE(question ->> 'required', 'false') = 'true'
      AND NULLIF(TRIM(form_responses ->> (question ->> 'id')), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'A required answer is missing';
  END IF;

  INSERT INTO public.student_submissions (
    student_id,
    story_id,
    form_template_id,
    responses,
    audio_url,
    auto_graded,
    auto_feedback,
    grade,
    feedback_arabic,
    submitted_at,
    graded_at,
    status
  )
  VALUES (
    student_record.id,
    story_uuid,
    form_template_uuid,
    form_responses,
    audio_url,
    grade_value,
    TRIM(feedback_value),
    grade_value,
    TRIM(feedback_value),
    NOW(),
    NOW(),
    'graded'
  )
  RETURNING student_submissions.id INTO submission_id;

  BEGIN
    PERFORM public.update_student_stats(student_record.id);
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
  END;

  RETURN QUERY
  SELECT
    ss.id,
    ss.student_id,
    ss.story_id,
    ss.form_template_id,
    ss.responses,
    ss.submitted_at,
    ss.status,
    ss.grade,
    ss.feedback_arabic
  FROM public.student_submissions AS ss
  WHERE ss.id = submission_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.server_submit_auto_graded_form(
  text, uuid, uuid, jsonb, integer, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.server_submit_auto_graded_form(
  text, uuid, uuid, jsonb, integer, text, text, text
) TO anon, authenticated, service_role;
