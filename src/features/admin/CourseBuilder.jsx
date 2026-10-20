import React, { useState } from 'react';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Layers
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { CourseKpiBanner } from './CourseKpiBanner';
import { CourseCardGrid } from './CourseCardGrid';
import { ProgramStudioModal } from './ProgramStudioModal';

export const CourseBuilder = () => {
  const { success, error } = useToast();
  const { courses, deleteCourse, syncFromSupabase } = useLmsStore();

  // Floating Program Studio Modal state
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [studioInitialStep, setStudioInitialStep] = useState(1);

  const handleOpenCreateModal = () => {
    setSelectedCourseId(null);
    setStudioInitialStep(1);
    setIsStudioModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setSelectedCourseId(course.id);
    setStudioInitialStep(1);
    setIsStudioModalOpen(true);
  };

  const handleOpenWorkspaceModal = (courseId) => {
    setSelectedCourseId(courseId);
    setStudioInitialStep(2); // Jump straight to Curriculum & Modules
    setIsStudioModalOpen(true);
  };

  const handleDeleteCourse = async (courseId) => {
    const target = courses.find((c) => c.id === courseId);
    if (!target) return;
    if (window.confirm(`Are you sure you want to delete "${target.title}"? This action cannot be undone.`)) {
      try {
        await deleteCourse(courseId);
        await syncFromSupabase();
        success(`Program "${target.title}" was deleted.`);
      } catch (err) {
        error(err.message || 'Failed to delete program.');
      }
    }
  };

  return (
    <div className="w-full space-y-6 pb-16 font-sans">
      




      {/* ─── Programs Card & Table Grid ──────────────────────────── */}
      <CourseCardGrid
        courses={courses}
        onSelectCourse={handleOpenWorkspaceModal}
        onCreateNew={handleOpenCreateModal}
        onEditCourse={handleOpenEditModal}
        onDeleteCourse={handleDeleteCourse}
      />

      {/* ─── Floating Multi-Step Program Studio Modal ────────────── */}
      {isStudioModalOpen && (
        <ProgramStudioModal
          isOpen={isStudioModalOpen}
          onClose={() => setIsStudioModalOpen(false)}
          courseId={selectedCourseId}
          initialStep={studioInitialStep}
          onSaveSuccess={() => {
            syncFromSupabase();
          }}
        />
      )}
    </div>
  );
};

export default CourseBuilder;
