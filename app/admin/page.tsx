'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllSections, getQuestionsBySection } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Section, Question } from '@/lib/db';

export default function AdminQuestionBank() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedRound, setSelectedRound] = useState('grid');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    content: '',
    answer_type: 'mcq' as 'mcq' | 'numeric',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: '',
    points: 1,
    difficulty_tier: 'easy' as 'easy' | 'medium' | 'hard',
  });

  useEffect(() => {
    const loadSections = async () => {
      const sectionsData = await getAllSections();
      setSections(sectionsData);
      if (sectionsData.length > 0) {
        setSelectedSection(sectionsData[0].id);
      } else {
        // Show helpful message if no sections
        console.warn('No sections found. Please seed the database with sample data.');
      }
      setLoading(false);
    };

    loadSections();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    if (selectedSection) {
      const loadQuestions = async () => {
        const questionsData = await getQuestionsBySection(
          selectedSection,
          selectedRound as any
        );
        setQuestions(questionsData);
      };

      loadQuestions();
    }
  }, [selectedSection, selectedRound]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSection || !formData.content || !formData.correct_answer) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('questions').insert({
        section_id: selectedSection,
        round_type: selectedRound,
        content: formData.content,
        answer_type: formData.answer_type,
        option_a: formData.answer_type === 'mcq' ? formData.option_a : null,
        option_b: formData.answer_type === 'mcq' ? formData.option_b : null,
        option_c: formData.answer_type === 'mcq' ? formData.option_c : null,
        option_d: formData.answer_type === 'mcq' ? formData.option_d : null,
        correct_answer: formData.correct_answer,
        points: formData.points,
        difficulty_tier: formData.difficulty_tier,
      });

      if (error) throw error;

      // Reload questions
      const questionsData = await getQuestionsBySection(selectedSection, selectedRound as any);
      setQuestions(questionsData);

      // Reset form
      setFormData({
        content: '',
        answer_type: 'mcq',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: '',
        points: 1,
        difficulty_tier: 'easy',
      });
      setShowAddForm(false);

      alert('Question added successfully');
    } catch (err) {
      alert('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);

      if (error) throw error;

      setQuestions(questions.filter((q) => q.id !== id));
      alert('Question deleted');
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError('');
    setCsvSuccess('');

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');

      if (lines.length < 2) {
        setCsvError('CSV must have at least a header and one data row');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const expectedHeaders = [
        'section',
        'round_type',
        'difficulty_tier',
        'content',
        'answer_type',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'points',
      ];

      // Validate headers
      const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setCsvError(`Missing columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const rows = lines.slice(1);
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        if (!rows[i].trim()) continue;

        const cells = rows[i].split(',').map((c) => c.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, idx) => {
          row[header] = cells[idx] || '';
        });

        try {
          // Validate row
          if (!row.content || !row.correct_answer || !row.answer_type) {
            errors.push(`Row ${i + 2}: Missing required fields`);
            continue;
          }

          if (!['mcq', 'numeric'].includes(row.answer_type)) {
            errors.push(`Row ${i + 2}: Invalid answer_type`);
            continue;
          }

          // Find section by name
          const section = sections.find((s) => s.name === row.section);
          if (!section) {
            errors.push(`Row ${i + 2}: Section not found`);
            continue;
          }

          // Insert question
          const { error } = await supabase.from('questions').insert({
            section_id: section.id,
            round_type: row.round_type,
            difficulty_tier: row.difficulty_tier || null,
            content: row.content,
            answer_type: row.answer_type,
            option_a: row.answer_type === 'mcq' ? row.option_a : null,
            option_b: row.answer_type === 'mcq' ? row.option_b : null,
            option_c: row.answer_type === 'mcq' ? row.option_c : null,
            option_d: row.answer_type === 'mcq' ? row.option_d : null,
            correct_answer: row.correct_answer,
            points: parseInt(row.points) || 1,
          });

          if (error) {
            errors.push(`Row ${i + 2}: ${error.message}`);
            continue;
          }

          successCount++;
        } catch (err) {
          errors.push(`Row ${i + 2}: Parse error`);
        }
      }

      if (successCount > 0) {
        setCsvSuccess(`${successCount} questions imported successfully`);

        // Reload questions
        const questionsData = await getQuestionsBySection(selectedSection, selectedRound as any);
        setQuestions(questionsData);
      }

      if (errors.length > 0) {
        setCsvError(`Some rows failed:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
      }

      // Reset file input
      e.target.value = '';
    } catch (err) {
      setCsvError('Failed to parse CSV file');
    }
  };

  const downloadTemplate = () => {
    const template = `section,round_type,difficulty_tier,content,answer_type,option_a,option_b,option_c,option_d,correct_answer,points
Number Sprouts,grid,easy,What is 2+2?,mcq,3,4,5,6,4,1
Counting Champions,grid,medium,What is 5+3?,mcq,7,8,9,10,8,1
Math Explorers,grid,easy,What is 10-3?,mcq,6,7,8,9,7,1
Number Navigators,tiered,easy,Solve: x + 2 = 5,numeric,,,,,3,1
Equation Builders,tiered,medium,Solve: 2x = 10,numeric,,,,,5,1
Logic Leaders,sprint,,What is 8 ÷ 2?,numeric,,,,,4,1
Problem Solvers,grid,hard,What is 15% of 200?,mcq,25,30,35,40,30,1
Math Mavericks,sprint,,What is 100 - 45?,mcq,50,55,60,65,55,1
Junior Analysts,grid,medium,What is 7 × 6?,mcq,40,41,42,43,42,1
Algebra Masters,tiered,hard,What is log₁₀(100)?,numeric,,,,,2,1
Olympiad Challengers,grid,hard,What is the square root of 144?,mcq,10,11,12,13,12,1
Elite Mathematicians,sprint,,Solve: x² = 25,numeric,,,,,5,1
Math Titans,grid,hard,What is the derivative of x³?,numeric,,,,,3x²,1
Grand Olympians,tiered,hard,Solve: sin(x) = 0.5,numeric,,,,,0.5236,1`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'math_olympiad_template.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-graph-paper flex items-center justify-center">
        <p className="text-ink-navy font-body">Loading...</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-graph-paper">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <h1 className="text-lg sm:text-2xl font-display font-bold truncate">Question Bank</h1>
            <div className="flex items-center gap-3">
              <Link href="/host" className="text-marigold hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body">
                Back to Host
              </Link>
              <button
                onClick={handleLogout}
                className="text-coral-flare hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
            <p className="text-yellow-800 font-display font-bold text-lg mb-2">No Sections Found</p>
            <p className="text-yellow-700 font-body mb-4">
              The database needs to be seeded with sample sections and questions. 
              Please run the seed.sql script in your Supabase database.
            </p>
            <p className="text-yellow-700 font-body text-sm">
              Navigate to Supabase SQL Editor and run: <code className="bg-yellow-100 px-2 py-1 rounded">supabase/seed.sql</code>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graph-paper">
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-2xl font-display font-bold truncate">Question Bank</h1>
          <div className="flex items-center gap-3">
            <Link href="/host" className="text-marigold hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body">
              Back to Host
            </Link>
            <button
              onClick={handleLogout}
              className="text-coral-flare hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filters & Actions */}
        <div className="bg-white rounded-lg p-6 sm:p-8 mb-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div>
              <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                Round Type
              </label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
              >
                <option value="grid">Grid</option>
                <option value="tiered">Tiered</option>
                <option value="sprint">Sprint</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex-1 py-2 bg-leaf-green text-white font-display font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm focus-ring"
              >
                {showAddForm ? 'Cancel' : '+ Add Question'}
              </button>
            </div>
          </div>

          {/* CSV Import */}
          <div className="border-t border-gray-300 pt-6 mt-6">
            <p className="font-display font-bold text-ink-navy mb-4 text-sm">Bulk Import (CSV)</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <label className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-leaf-green transition text-center text-xs sm:text-sm">
                <span className="font-body">Choose CSV file</span>
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 border-2 border-ink-navy text-ink-navy font-display font-bold rounded-lg hover:bg-ink-navy hover:text-white transition whitespace-nowrap text-sm focus-ring"
              >
                Download Template
              </button>
            </div>

            {csvError && (
              <div className="mt-4 p-4 bg-coral-flare bg-opacity-10 border-l-4 border-coral-flare rounded">
                <p className="text-coral-flare text-xs sm:text-sm whitespace-pre-wrap font-body">{csvError}</p>
              </div>
            )}

            {csvSuccess && (
              <div className="mt-4 p-4 bg-leaf-green bg-opacity-10 border-l-4 border-leaf-green rounded">
                <p className="text-leaf-green text-sm font-display font-bold">{csvSuccess}</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Question Form */}
        {showAddForm && (
          <div className="bg-calculator-blue bg-opacity-10 rounded-lg p-6 sm:p-8 mb-8 border-2 border-calculator-blue">
            <h3 className="text-lg sm:text-xl font-display font-bold text-ink-navy mb-6">Add New Question</h3>

            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                  Question Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                    Answer Type
                  </label>
                  <select
                    value={formData.answer_type}
                    onChange={(e) =>
                      setFormData({ ...formData, answer_type: e.target.value as 'mcq' | 'numeric' })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="numeric">Numeric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty_tier}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty_tier: e.target.value as 'easy' | 'medium' | 'hard' })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {formData.answer_type === 'mcq' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                        Option A
                      </label>
                      <input
                        type="text"
                        value={formData.option_a}
                        onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                        Option B
                      </label>
                      <input
                        type="text"
                        value={formData.option_b}
                        onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                        Option C
                      </label>
                      <input
                        type="text"
                        value={formData.option_c}
                        onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                        Option D
                      </label>
                      <input
                        type="text"
                        value={formData.option_d}
                        onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                      Correct Answer (must match one option)
                    </label>
                    <input
                      type="text"
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                    Correct Answer (numeric)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-display font-bold text-ink-navy mb-2">
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none font-body transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-leaf-green text-white font-display font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all focus-ring"
              >
                Add Question
              </button>
            </form>
          </div>
        )}

        {/* Questions List */}
        <div>
          <h3 className="text-lg sm:text-xl font-display font-bold text-ink-navy mb-4 sm:mb-6">
            Questions ({questions.length})
          </h3>

          <div className="space-y-3 sm:space-y-4">
            {questions.length === 0 ? (
              <div className="bg-white rounded-lg p-6 sm:p-8 text-center shadow-md">
                <p className="text-ink-navy font-body opacity-75">No questions for this section and round type</p>
              </div>
            ) : (
              questions.map((question) => (
                <div key={question.id} className="bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 border-leaf-green hover:shadow-lg transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-ink-navy mb-2 text-sm sm:text-base break-words">
                        {question.content}
                      </p>
                      <div className="flex gap-3 text-xs sm:text-sm text-ink-navy font-body opacity-75 flex-wrap">
                        <span>{question.answer_type === 'mcq' ? '📋 MCQ' : '🔢 Numeric'}</span>
                        {question.difficulty_tier && <span>{question.difficulty_tier}</span>}
                        <span>{question.points} pts</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="px-3 py-1 bg-coral-flare bg-opacity-10 text-coral-flare rounded text-xs sm:text-sm font-display font-bold hover:bg-opacity-20 active:scale-95 transition-all focus-ring whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
