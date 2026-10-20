import React, { useState, useEffect } from 'react';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import { Award, Plus, Trash2, Shield, Settings, Copy, HelpCircle, CheckSquare, List, Clock, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';

export const Assessments = () => {
  const { success, error } = useToast();
  const { courses, createAssessment, deleteAssessment } = useLmsStore();

  const [activeTab, setActiveTab] = useState('assessments'); // 'assessments' | 'questions'

  // Question Bank list state (persisted to localStorage)
  const [questionsBank, setQuestionsBank] = useState(() => {
    const cached = localStorage.getItem('_lms_questions_bank');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'q-bank-1',
        question: 'What is the primary role of protein in workout recovery?',
        category: 'Nutrition',
        difficulty: 'Easy',
        type: 'mcq',
        options: [
          { text: 'Muscle repair and synthesis', isCorrect: true },
          { text: 'Glycogen replenishment only', isCorrect: false },
          { text: 'Hydration enhancement', isCorrect: false }
        ],
        explanation: 'Protein provides the essential amino acids required to repair and rebuild muscle tissues damaged during workouts.'
      },
      {
        id: 'q-bank-2',
        question: 'True or False: Isometric muscle contractions involve zero joint movement.',
        category: 'Fitness',
        difficulty: 'Medium',
        type: 'boolean',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        explanation: 'True. In isometric contractions, the muscle tension increases but the muscle length does not change and joint angle remains static.'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('_lms_questions_bank', JSON.stringify(questionsBank));
  }, [questionsBank]);

  // Question creator state
  const [newQuestionData, setNewQuestionData] = useState({
    question: '',
    category: 'General',
    difficulty: 'Easy',
    type: 'mcq',
    explanation: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctAnswer: 'A' // 'A' | 'B' | 'C' | 'D' for MCQ, 'true' | 'false' for boolean
  });

  // Assessment creator state
  const [assessmentData, setAssessmentData] = useState({
    title: '',
    courseId: courses[0]?.id || '',
    level: 'module', // 'final' | 'module' | 'lesson'
    moduleId: '',
    lessonId: '',
    passingPercentage: 70,
    timerSeconds: 120,
    selectedQuestions: [] // list of question ids
  });

  // Dynamic dropdown dependencies
  const selectedCourse = courses.find(c => c.id === assessmentData.courseId);
  const selectedModule = selectedCourse?.modules?.find(m => m.id === assessmentData.moduleId);

  // Auto-set module and lesson if course changes
  useEffect(() => {
    if (selectedCourse) {
      const firstModId = selectedCourse.modules?.[0]?.id || '';
      setAssessmentData(prev => ({
        ...prev,
        moduleId: firstModId,
        lessonId: selectedCourse.modules?.[0]?.lessons?.[0]?.id || ''
      }));
    }
  }, [assessmentData.courseId, courses]);

  // Auto-set lesson if module changes
  useEffect(() => {
    if (selectedModule) {
      setAssessmentData(prev => ({
        ...prev,
        lessonId: selectedModule.lessons?.[0]?.id || ''
      }));
    }
  }, [assessmentData.moduleId]);

  // Extract all existing assessments from courses nested structure
  const allAssessments = [];
  courses.forEach(c => {
    if (c.finalAssessment) {
      allAssessments.push({
        ...c.finalAssessment,
        type: 'final',
        courseName: c.title,
        courseId: c.id
      });
    }
    c.modules?.forEach(m => {
      if (m.assessment) {
        allAssessments.push({
          ...m.assessment,
          type: 'module',
          courseName: c.title,
          courseId: c.id,
          moduleName: m.title,
          moduleId: m.id
        });
      }
      m.lessons?.forEach(l => {
        if (l.assessment) {
          allAssessments.push({
            ...l.assessment,
            type: 'lesson',
            courseName: c.title,
            courseId: c.id,
            moduleName: m.title,
            moduleId: m.id,
            lessonName: l.title,
            lessonId: l.id
          });
        }
      });
    });
  });

  const handleAddQuestion = () => {
    if (!newQuestionData.question) {
      error('Question text is required!');
      return;
    }

    let options = [];
    if (newQuestionData.type === 'mcq') {
      if (!newQuestionData.optA || !newQuestionData.optB) {
        error('MCQs require at least Option A and Option B!');
        return;
      }
      options = [
        { text: newQuestionData.optA, isCorrect: newQuestionData.correctAnswer === 'A' },
        { text: newQuestionData.optB, isCorrect: newQuestionData.correctAnswer === 'B' }
      ];
      if (newQuestionData.optC) {
        options.push({ text: newQuestionData.optC, isCorrect: newQuestionData.correctAnswer === 'C' });
      }
      if (newQuestionData.optD) {
        options.push({ text: newQuestionData.optD, isCorrect: newQuestionData.correctAnswer === 'D' });
      }
    } else {
      options = [
        { text: 'True', isCorrect: newQuestionData.correctAnswer === 'true' },
        { text: 'False', isCorrect: newQuestionData.correctAnswer === 'false' }
      ];
    }

    const newQ = {
      id: `q-bank-${Date.now()}`,
      question: newQuestionData.question,
      category: newQuestionData.category,
      difficulty: newQuestionData.difficulty,
      type: newQuestionData.type,
      options,
      explanation: newQuestionData.explanation || 'No explanation provided.'
    };

    setQuestionsBank([newQ, ...questionsBank]);
    success('Question added to Bank!');
    setNewQuestionData({
      question: '',
      category: 'General',
      difficulty: 'Easy',
      type: 'mcq',
      explanation: '',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      correctAnswer: 'A'
    });
  };

  const handleDeleteQuestion = (id) => {
    setQuestionsBank(questionsBank.filter(q => q.id !== id));
    success('Question removed from Bank.');
  };

  const handleToggleQuestionSelection = (qId) => {
    const isSelected = assessmentData.selectedQuestions.includes(qId);
    if (isSelected) {
      setAssessmentData(prev => ({
        ...prev,
        selectedQuestions: prev.selectedQuestions.filter(id => id !== qId)
      }));
    } else {
      setAssessmentData(prev => ({
        ...prev,
        selectedQuestions: [...prev.selectedQuestions, qId]
      }));
    }
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!assessmentData.title) {
      error('Assessment title is required!');
      return;
    }
    if (assessmentData.selectedQuestions.length === 0) {
      error('Please select at least one question to include!');
      return;
    }

    // Map selected question items
    const selectedQuestionItems = questionsBank.filter(q => 
      assessmentData.selectedQuestions.includes(q.id)
    );

    const payload = {
      courseId: assessmentData.courseId,
      moduleId: assessmentData.level === 'module' || assessmentData.level === 'lesson' ? assessmentData.moduleId : null,
      lessonId: assessmentData.level === 'lesson' ? assessmentData.lessonId : null,
      title: assessmentData.title,
      passingPercentage: parseInt(assessmentData.passingPercentage) || 70,
      timerSeconds: parseInt(assessmentData.timerSeconds) || 120,
      questions: selectedQuestionItems,
      isFinal: assessmentData.level === 'final'
    };

    try {
      await createAssessment(payload);
      success('Assessment created and synchronized successfully!');
      // Reset form
      setAssessmentData(prev => ({
        ...prev,
        title: '',
        selectedQuestions: []
      }));
    } catch (err) {
      error(err.message || 'Failed to create assessment.');
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (confirm('Are you sure you want to delete this assessment? This will remove all questions associated with it.')) {
      try {
        await deleteAssessment(id);
        success('Assessment deleted successfully!');
      } catch (err) {
        error('Failed to delete assessment.');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-main">Assessments & Exams</h1>
          <p className="text-xs text-text-secondary">Oversight of exam metrics, question shuffles, and syllabus checkpoints</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'assessments' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            Assessments Builder
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'questions' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            Questions Bank ({questionsBank.length})
          </button>
        </div>
      </div>

      {activeTab === 'assessments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Assessment Form */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-white shadow-premium">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-primary" /> Create Assessment
                </CardTitle>
                <CardDescription>Assemble a quiz or exam for real-time play</CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <form onSubmit={handleCreateAssessment} className="space-y-4">
                  <Input
                    label="Assessment Title"
                    placeholder="E.g., Module 1 Quiz: Intro"
                    value={assessmentData.title}
                    onChange={e => setAssessmentData({ ...assessmentData, title: e.target.value })}
                  />

                  <Select
                    label="Course"
                    options={courses.map(c => ({ value: c.id, label: c.title }))}
                    value={assessmentData.courseId}
                    onValueChange={val => setAssessmentData({ ...assessmentData, courseId: val })}
                  />

                  <Select
                    label="Assessment Level"
                    options={[
                      { value: 'module', label: 'Module Quiz' },
                      { value: 'lesson', label: 'Lesson Quiz' },
                      { value: 'final', label: 'Course Final Exam' }
                    ]}
                    value={assessmentData.level}
                    onValueChange={val => setAssessmentData({ ...assessmentData, level: val })}
                  />

                  {(assessmentData.level === 'module' || assessmentData.level === 'lesson') && selectedCourse && (
                    <Select
                      label="Target Module"
                      options={(selectedCourse.modules || []).map(m => ({ value: m.id, label: m.title }))}
                      value={assessmentData.moduleId}
                      onValueChange={val => setAssessmentData({ ...assessmentData, moduleId: val })}
                    />
                  )}

                  {assessmentData.level === 'lesson' && selectedModule && (
                    <Select
                      label="Target Lesson"
                      options={(selectedModule.lessons || []).map(l => ({ value: l.id, label: l.title }))}
                      value={assessmentData.lessonId}
                      onValueChange={val => setAssessmentData({ ...assessmentData, lessonId: val })}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Passing Score (%)"
                      type="number"
                      min="1"
                      max="100"
                      value={assessmentData.passingPercentage}
                      onChange={e => setAssessmentData({ ...assessmentData, passingPercentage: e.target.value })}
                    />
                    <Input
                      label="Timer (seconds)"
                      type="number"
                      min="10"
                      value={assessmentData.timerSeconds}
                      onChange={e => setAssessmentData({ ...assessmentData, timerSeconds: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                      Choose Questions ({assessmentData.selectedQuestions.length} selected)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-border rounded-xl p-2.5 space-y-1.5 bg-background/50">
                      {questionsBank.length === 0 ? (
                        <p className="text-[10px] text-text-secondary text-center py-4">No questions in bank. Create some first!</p>
                      ) : (
                        questionsBank.map(q => {
                          const selected = assessmentData.selectedQuestions.includes(q.id);
                          return (
                            <button
                              type="button"
                              key={q.id}
                              onClick={() => handleToggleQuestionSelection(q.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-all ${
                                selected ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white border-border hover:bg-gray-50 text-text-secondary'
                              }`}
                            >
                              <span className="truncate pr-2">{q.question}</span>
                              <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                                selected ? 'border-primary bg-primary text-white' : 'border-border'
                              }`}>
                                {selected && <Check className="h-2.5 w-2.5" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <Button type="submit" variant="primary" className="w-full justify-center text-xs h-10 mt-2">
                    Create & Sync Assessment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Active Assessments list */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border bg-white shadow-premium">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-primary" /> Active Database Assessments
                </CardTitle>
                <CardDescription>Live exams currently embedded in the syllabus</CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                {allAssessments.length === 0 ? (
                  <p className="text-xs text-text-secondary py-8 text-center">No assessments in database. Create one to begin.</p>
                ) : (
                  <div className="space-y-4">
                    {allAssessments.map((a) => (
                      <div key={a.id} className="p-4 border border-border rounded-2xl bg-[#FAFAFB]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/20 transition-all">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={a.type === 'final' ? 'success' : a.type === 'lesson' ? 'outline' : 'primary'}>
                              {a.type === 'final' ? 'Course Exam' : a.type === 'lesson' ? 'Lesson Quiz' : 'Module Quiz'}
                            </Badge>
                            <span className="text-[10px] text-text-secondary font-bold truncate max-w-xs">{a.courseName}</span>
                          </div>
                          
                          <h4 className="font-bold text-sm text-text-main">{a.title}</h4>
                          
                          <div className="flex gap-4 items-center text-[10px] text-text-secondary font-bold uppercase">
                            <span className="flex items-center gap-1"><List className="h-3.5 w-3.5 text-primary" />{a.questions?.length || 0} Questions</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" />{a.timerSeconds}s limit</span>
                            <span className="flex items-center gap-1">Passing: {a.passingPercentage}%</span>
                          </div>
                          
                          {a.moduleName && (
                            <p className="text-[10px] text-text-secondary font-semibold">
                              Attached to: {a.moduleName} {a.lessonName ? `→ ${a.lessonName}` : ''}
                            </p>
                          )}
                        </div>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteAssessment(a.id)} 
                          className="text-text-secondary hover:text-error h-9 w-9 p-0 shrink-0 self-end sm:self-center"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Creator */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-white shadow-premium">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Plus className="h-4.5 w-4.5 text-primary" /> Create Question
                </CardTitle>
                <CardDescription>Setup details to add to Question Bank</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                <Input
                  label="Question Content"
                  placeholder="E.g., What defines aerobic threshold?"
                  value={newQuestionData.question}
                  onChange={e => setNewQuestionData({ ...newQuestionData, question: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    options={[
                      { value: 'General', label: 'General' },
                      { value: 'Fitness', label: 'Fitness' },
                      { value: 'Nutrition', label: 'Nutrition' },
                      { value: 'Yoga', label: 'Yoga' }
                    ]}
                    value={newQuestionData.category}
                    onValueChange={val => setNewQuestionData({ ...newQuestionData, category: val })}
                  />
                  <Select
                    label="Difficulty"
                    options={[
                      { value: 'Easy', label: 'Easy' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'Hard', label: 'Hard' }
                    ]}
                    value={newQuestionData.difficulty}
                    onValueChange={val => setNewQuestionData({ ...newQuestionData, difficulty: val })}
                  />
                </div>

                <Select
                  label="Format Type"
                  options={[
                    { value: 'mcq', label: 'Multiple Choice (MCQ)' },
                    { value: 'boolean', label: 'True / False' }
                  ]}
                  value={newQuestionData.type}
                  onValueChange={val => setNewQuestionData({ ...newQuestionData, type: val })}
                />

                {newQuestionData.type === 'mcq' ? (
                  <div className="space-y-2 border border-border p-3.5 rounded-xl bg-background/30">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Option Options</span>
                    <Input
                      placeholder="Option A (required)"
                      value={newQuestionData.optA}
                      onChange={e => setNewQuestionData({ ...newQuestionData, optA: e.target.value })}
                    />
                    <Input
                      placeholder="Option B (required)"
                      value={newQuestionData.optB}
                      onChange={e => setNewQuestionData({ ...newQuestionData, optB: e.target.value })}
                    />
                    <Input
                      placeholder="Option C (optional)"
                      value={newQuestionData.optC}
                      onChange={e => setNewQuestionData({ ...newQuestionData, optC: e.target.value })}
                    />
                    <Input
                      placeholder="Option D (optional)"
                      value={newQuestionData.optD}
                      onChange={e => setNewQuestionData({ ...newQuestionData, optD: e.target.value })}
                    />
                    <Select
                      label="Select Correct Option"
                      options={[
                        { value: 'A', label: 'Option A' },
                        { value: 'B', label: 'Option B' },
                        { value: 'C', label: 'Option C' },
                        { value: 'D', label: 'Option D' }
                      ]}
                      value={newQuestionData.correctAnswer}
                      onValueChange={val => setNewQuestionData({ ...newQuestionData, correctAnswer: val })}
                    />
                  </div>
                ) : (
                  <Select
                    label="Correct Answer"
                    options={[
                      { value: 'true', label: 'True' },
                      { value: 'false', label: 'False' }
                    ]}
                    value={newQuestionData.correctAnswer}
                    onValueChange={val => setNewQuestionData({ ...newQuestionData, correctAnswer: val })}
                  />
                )}

                <Input
                  label="Explanation text"
                  placeholder="Explain why the answer is correct"
                  value={newQuestionData.explanation}
                  onChange={e => setNewQuestionData({ ...newQuestionData, explanation: e.target.value })}
                />

                <Button variant="primary" onClick={handleAddQuestion} className="w-full justify-center text-xs h-10">
                  Save to Question Bank
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Question Bank list */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border bg-white shadow-premium">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-primary" /> Active Question Bank
                </CardTitle>
                <CardDescription>Auditing questions in system directories</CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                {questionsBank.length === 0 ? (
                  <p className="text-xs text-text-secondary py-8 text-center">No questions in bank.</p>
                ) : (
                  <div className="space-y-3">
                    {questionsBank.map((q) => (
                      <div key={q.id} className="p-3.5 border border-border rounded-xl bg-background/30 flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-text-main leading-tight block">
                            {q.question}
                          </span>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline">{q.category}</Badge>
                            <Badge variant="primary">{q.difficulty}</Badge>
                            <span className="text-[10px] text-text-secondary font-bold uppercase">{q.type}</span>
                          </div>
                          
                          {/* Render Options Review in Bank */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 max-w-md">
                            {q.options?.map((opt, oIdx) => (
                              <div key={oIdx} className={`p-1.5 px-2.5 rounded-lg border text-[10px] font-bold flex items-center justify-between ${
                                opt.isCorrect ? 'bg-success/5 border-success/20 text-success' : 'bg-white border-border text-text-secondary'
                              }`}>
                                <span className="truncate">{opt.text}</span>
                                {opt.isCorrect && <Check className="h-3 w-3" />}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)} className="p-1 h-8 w-8 text-text-secondary hover:text-error shrink-0">
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessments;
