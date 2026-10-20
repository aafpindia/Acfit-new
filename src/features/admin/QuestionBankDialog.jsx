import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  HelpCircle,
  Plus,
  Search,
  CheckCircle,
  Trash2,
  BookOpen,
  Filter,
  Sparkles,
  Award
} from 'lucide-react';

export const QuestionBankDialog = ({
  isOpen,
  onClose,
  questionsBank = [],
  onAddQuestion,
  onDeleteQuestion,
  onImportToCourse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [newQuestionData, setNewQuestionData] = useState({
    question: '',
    category: 'Fitness',
    difficulty: 'Easy',
    type: 'mcq',
    explanation: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctAnswer: 'A'
  });

  const categories = ['All', 'Fitness', 'Nutrition', 'Anatomy', 'Recovery', 'General'];

  const filteredQuestions = questionsBank.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newQuestionData.question.trim()) return;

    let options = [];
    if (newQuestionData.type === 'mcq') {
      options = [
        { text: newQuestionData.optA || 'Option A', isCorrect: newQuestionData.correctAnswer === 'A' },
        { text: newQuestionData.optB || 'Option B', isCorrect: newQuestionData.correctAnswer === 'B' },
        { text: newQuestionData.optC || 'Option C', isCorrect: newQuestionData.correctAnswer === 'C' },
        { text: newQuestionData.optD || 'Option D', isCorrect: newQuestionData.correctAnswer === 'D' }
      ].filter(opt => opt.text.trim().length > 0);
    } else {
      options = [
        { text: 'True', isCorrect: newQuestionData.correctAnswer === 'A' },
        { text: 'False', isCorrect: newQuestionData.correctAnswer === 'B' }
      ];
    }

    const created = {
      id: `q-bank-${Date.now()}`,
      question: newQuestionData.question,
      category: newQuestionData.category,
      difficulty: newQuestionData.difficulty,
      type: newQuestionData.type,
      options,
      explanation: newQuestionData.explanation || 'Standard question explanation.'
    };

    if (onAddQuestion) onAddQuestion(created);

    setIsCreatingNew(false);
    setNewQuestionData({
      question: '',
      category: 'Fitness',
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent isOpen={isOpen} className="max-w-3xl bg-white border border-border shadow-2xl rounded-3xl p-6 sm:p-8 font-sans overflow-hidden">
        <DialogHeader className="space-y-1.5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-text-main tracking-tight flex items-center gap-2">
                  Global Question Bank Repository
                  <Badge variant="outline" className="text-xs font-bold border-primary/20 text-primary bg-primary/5">
                    {questionsBank.length} Questions
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-text-secondary">
                  Central database of quiz questions. Re-use questions across any program module or final exam.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant={isCreatingNew ? 'outline' : 'primary'}
              size="sm"
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="text-xs font-bold gap-1.5 shadow-2xs"
            >
              {isCreatingNew ? 'Back to Bank' : '+ Add Question to Bank'}
            </Button>
          </div>
        </DialogHeader>

        {isCreatingNew ? (
          /* New Question Creation Form */
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-1">
            <Input
              label="Question Description"
              placeholder="E.g. What is the primary function of progressive overload in strength training?"
              value={newQuestionData.question}
              onChange={(e) => setNewQuestionData({ ...newQuestionData, question: e.target.value })}
              required
              className="text-xs font-semibold"
            />

            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Category"
                options={categories.filter(c => c !== 'All').map(c => ({ value: c, label: c }))}
                value={newQuestionData.category}
                onValueChange={(val) => setNewQuestionData({ ...newQuestionData, category: val })}
              />
              <Select
                label="Difficulty"
                options={[
                  { value: 'Easy', label: 'Easy' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Hard', label: 'Hard' }
                ]}
                value={newQuestionData.difficulty}
                onValueChange={(val) => setNewQuestionData({ ...newQuestionData, difficulty: val })}
              />
              <Select
                label="Question Format"
                options={[
                  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
                  { value: 'boolean', label: 'True / False' }
                ]}
                value={newQuestionData.type}
                onValueChange={(val) => setNewQuestionData({ ...newQuestionData, type: val })}
              />
            </div>

            {newQuestionData.type === 'mcq' ? (
              <div className="space-y-3 p-3 bg-surface rounded-2xl border border-border">
                <span className="text-xs font-extrabold text-text-main">MCQ Answer Options & Key</span>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Option A text..."
                    value={newQuestionData.optA}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, optA: e.target.value })}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Option B text..."
                    value={newQuestionData.optB}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, optB: e.target.value })}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Option C text..."
                    value={newQuestionData.optC}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, optC: e.target.value })}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Option D text..."
                    value={newQuestionData.optD}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, optD: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <Select
                  label="Correct Answer Key"
                  options={[
                    { value: 'A', label: 'Option A is Correct' },
                    { value: 'B', label: 'Option B is Correct' },
                    { value: 'C', label: 'Option C is Correct' },
                    { value: 'D', label: 'Option D is Correct' }
                  ]}
                  value={newQuestionData.correctAnswer}
                  onValueChange={(val) => setNewQuestionData({ ...newQuestionData, correctAnswer: val })}
                />
              </div>
            ) : (
              <div className="p-3 bg-surface rounded-2xl border border-border space-y-2">
                <span className="text-xs font-extrabold text-text-main">True / False Answer Key</span>
                <Select
                  options={[
                    { value: 'A', label: 'True' },
                    { value: 'B', label: 'False' }
                  ]}
                  value={newQuestionData.correctAnswer}
                  onValueChange={(val) => setNewQuestionData({ ...newQuestionData, correctAnswer: val })}
                />
              </div>
            )}

            <Input
              label="Explanation / Rational (Optional)"
              placeholder="Why this answer is correct..."
              value={newQuestionData.explanation}
              onChange={(e) => setNewQuestionData({ ...newQuestionData, explanation: e.target.value })}
              className="text-xs"
            />

            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={() => setIsCreatingNew(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" leftIcon={<CheckCircle className="h-4 w-4" />}>
                Save to Question Bank
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Question Bank Explorer List */
          <div className="space-y-4 pt-4">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search questions in bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-2">
                <Select
                  options={categories.map(c => ({ value: c, label: `Cat: ${c}` }))}
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  className="text-xs h-9 w-32"
                />
                <Select
                  options={[
                    { value: 'All', label: 'Diff: All' },
                    { value: 'Easy', label: 'Easy' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Hard', label: 'Hard' }
                  ]}
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                  className="text-xs h-9 w-32"
                />
              </div>
            </div>

            {/* Questions List Container */}
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-2xl text-xs text-text-secondary">
                  No questions found in bank. Add custom questions above!
                </div>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-card border border-border rounded-2xl shadow-2xs hover:border-primary/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-extrabold uppercase text-primary border-primary/20 bg-primary/5">
                            {q.category || 'General'}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-semibold text-text-secondary">
                            {q.difficulty || 'Easy'}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] uppercase">
                            {q.type}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-xs text-text-main leading-snug">
                          {idx + 1}. {q.question}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onImportToCourse && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onImportToCourse(q)}
                            className="text-[11px] h-7 px-2.5 font-bold gap-1"
                          >
                            + Import
                          </Button>
                        )}
                        {onDeleteQuestion && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteQuestion(q.id)}
                            className="p-1.5 h-7 text-text-muted hover:text-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Option Choices Pill Badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      {q.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                            opt.isCorrect
                              ? 'bg-success-dim border-success/30 text-success font-bold'
                              : 'bg-surface border-border/50 text-text-secondary'
                          }`}
                        >
                          <span className="truncate">
                            <strong className="mr-1.5">{String.fromCharCode(65 + oIdx)}:</strong>
                            {opt.text}
                          </span>
                          {opt.isCorrect && <CheckCircle className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-text-muted italic bg-surface/50 p-2 rounded-xl border border-border/40">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Close Question Bank
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuestionBankDialog;
