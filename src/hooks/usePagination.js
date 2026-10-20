import { useState, useMemo } from 'react';

export const usePagination = ({ totalItems, initialPageSize = 10, initialPage = 1 }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(totalItems / pageSize)), 
    [totalItems, pageSize]
  );

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  
  const goToPage = (page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage,
    pageSize,
    totalPages,
    setPageSize,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
};

export default usePagination;
