import { useState, useEffect } from 'react'

const PaginationControls = ({ 
  pagination, 
  onPageChange, 
  isLoading = false,
  showResultsInfo = true 
}) => {
  const [inputPage, setInputPage] = useState('')
  
  useEffect(() => {
    setInputPage('')
  }, [pagination.currentPage])

  if (!pagination || pagination.totalPages <= 1) {
    return null
  }

  const { currentPage, totalPages, totalCount, limit, hasNextPage, hasPrevPage } = pagination

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !isLoading) {
      onPageChange(page)
    }
  }

  const handleGoToPage = () => {
    const page = parseInt(inputPage)
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      handlePageClick(page)
    }
    setInputPage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGoToPage()
    }
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, totalCount)

  return (
    <div className="pagination-container">
      {showResultsInfo && (
        <div className="pagination-info">
          <span className="results-text">
            Showing {startItem}-{endItem} of {totalCount} rooms
          </span>
        </div>
      )}
      
      <div className="pagination-controls">
        {/* Previous Button */}
        <button
          className={`pagination-btn pagination-prev ${!hasPrevPage || isLoading ? 'disabled' : ''}`}
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={!hasPrevPage || isLoading}
          aria-label="Previous page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
          Previous
        </button>

        {/* Page Numbers */}
        <div className="pagination-pages">
          {/* First page if not shown */}
          {getPageNumbers()[0] > 1 && (
            <>
              <button
                className={`pagination-btn pagination-number`}
                onClick={() => handlePageClick(1)}
                disabled={isLoading}
              >
                1
              </button>
              {getPageNumbers()[0] > 2 && (
                <span className="pagination-ellipsis">...</span>
              )}
            </>
          )}

          {/* Page number buttons */}
          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`pagination-btn pagination-number ${page === currentPage ? 'active' : ''}`}
              onClick={() => handlePageClick(page)}
              disabled={isLoading}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          {/* Last page if not shown */}
          {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
            <>
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                <span className="pagination-ellipsis">...</span>
              )}
              <button
                className={`pagination-btn pagination-number`}
                onClick={() => handlePageClick(totalPages)}
                disabled={isLoading}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next Button */}
        <button
          className={`pagination-btn pagination-next ${!hasNextPage || isLoading ? 'disabled' : ''}`}
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={!hasNextPage || isLoading}
          aria-label="Next page"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>
      </div>

      {/* Go to page input */}
      {totalPages > 10 && (
        <div className="pagination-goto">
          <span className="goto-label">Go to page:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="goto-input"
            placeholder={currentPage.toString()}
            disabled={isLoading}
          />
          <button
            className="goto-btn"
            onClick={handleGoToPage}
            disabled={!inputPage || isLoading}
          >
            Go
          </button>
        </div>
      )}
    </div>
  )
}

export default PaginationControls