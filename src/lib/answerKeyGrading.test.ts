import {
  answersMatch,
  assertFormQuestionsHaveAnswerKeys,
  gradeAgainstAnswerKey,
  normalizeArabicAnswer,
  questionHasAnswerKey,
  questionsMissingAnswerKeys,
  stripQuestionAnswerKeys
} from './answerKeyGrading'

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
}

const questions = [
  {
    id: 'q1',
    type: 'multiple_choice',
    options: ['القطة', 'الكلب', 'الطائر'],
    correct_answer: 'القطة'
  },
  {
    id: 'q2',
    type: 'short_answer',
    correct_answer: 'الصديق الوفي | الصديق الوفى'
  },
  {
    id: 'q3',
    type: 'long_answer',
    correct_answer: 'ساعدت الجدة'
  }
]

assertEqual(normalizeArabicAnswer('  أَلْقِطَّة  '), 'القطه', 'Arabic normalization should collapse hamza, tashkeel, and ta marbuta')
assert(answersMatch('القطة', 'القطة', 'multiple_choice'), 'Multiple choice should match exactly')
assert(!answersMatch('الكلب', 'القطة', 'multiple_choice'), 'Wrong multiple choice should not match')
assert(answersMatch('الصديق الوفي', 'الصديق الوفي | الصديق الوفى', 'short_answer'), 'Short answers should accept one of the stored keys')
assert(answersMatch('ساعدت الجدّة', 'ساعدت الجدة', 'long_answer'), 'Long answers should match after Arabic normalization')

const perfect = gradeAgainstAnswerKey(questions, {
  q1: 'القطة',
  q2: 'الصديق الوفى',
  q3: 'ساعدت الجدة'
})
assert(perfect.ok, 'Complete keys with correct answers should grade')
if (perfect.ok) {
  assertEqual(perfect.grade, 100, 'All correct answers should score 100')
  assertEqual(perfect.correctCount, 3, 'All three questions should be counted as correct')
}

const mixed = gradeAgainstAnswerKey(questions, {
  q1: 'الكلب',
  q2: 'الصديق الوفي',
  q3: 'إجابة أخرى'
})
assert(mixed.ok, 'Complete keys should still produce an official grade when some answers are wrong')
if (mixed.ok) {
  assertEqual(mixed.grade, 33, 'One of three correct answers should round to 33')
  assertEqual(mixed.questionScores[0].correct, false, 'Wrong multiple choice must not be marked correct')
  assertEqual(mixed.questionScores[1].correct, true, 'Matching short answer must be marked correct')
}

const incompleteQuestions = [
  questions[0],
  { id: 'q2', type: 'short_answer' },
  questions[2]
]
const skipped = gradeAgainstAnswerKey(incompleteQuestions, {
  q1: 'القطة',
  q2: 'أي شيء',
  q3: 'ساعدت الجدة'
})
assert(!skipped.ok, 'Missing answer keys must not produce an official grade')
if (!skipped.ok) {
  assertEqual(skipped.reason, 'missing_answer_key', 'Missing keys should use the missing_answer_key reason')
  assertEqual(skipped.missingQuestionIds.join(','), 'q2', 'Only the question without a key should be reported')
}

assert(!questionHasAnswerKey({ id: 'q', type: 'short_answer' }), 'Empty short answers should be treated as missing keys')
assert(
  !questionHasAnswerKey({ id: 'q', type: 'multiple_choice', options: ['أ', 'ب'], correct_answer: 'ج' }),
  'Multiple choice keys must exist in the options list'
)
assertEqual(questionsMissingAnswerKeys(incompleteQuestions).length, 1, 'Exactly one question should be reported as missing a key')

let threw = false
try {
  assertFormQuestionsHaveAnswerKeys(incompleteQuestions)
} catch {
  threw = true
}
assert(threw, 'Saving a form without complete answer keys should fail')

const stripped = stripQuestionAnswerKeys([{ id: 'q1', text_arabic: 'سؤال', correct_answer: 'سر' }])
assertEqual('correct_answer' in stripped[0], false, 'Student-facing questions must not include correct_answer')
assertEqual(stripped[0].id, 'q1', 'Stripping keys should keep the rest of the question')

console.log('answerKeyGrading tests passed')
