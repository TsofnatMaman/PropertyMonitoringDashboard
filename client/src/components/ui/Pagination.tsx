import Button from "./Button";

export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type PaginationControlsProps = PaginationInfo & {
  onGoToPage: (page: number) => void;
  onNext: () => void;
  onPrev: () => void;
};

export default function PaginationControls({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onGoToPage,
  onNext,
  onPrev,
}: PaginationControlsProps) {
  const visiblePages = 5;
  const halfVisible = Math.floor(visiblePages / 2);
  const startPage = Math.max(1, currentPage - halfVisible);
  const endPage = Math.min(totalPages, startPage + visiblePages - 1);
  const adjustedStart = Math.max(1, endPage - visiblePages + 1);

  const pages = Array.from(
    { length: Math.min(visiblePages, totalPages) },
    (_, i) => adjustedStart + i
  );

  return (
    <div className="pagination">
      <Button
        onClick={onPrev}
        disabled={!hasPrevPage}
        className="pagination__button"
      >
        Previous
      </Button>

      {adjustedStart > 1 && (
        <>
          <Button
            onClick={() => onGoToPage(1)}
            className={`pagination__button ${
              currentPage === 1 ? "pagination__button--active" : ""
            }`}
          >
            1
          </Button>
          {adjustedStart > 2 && (
            <span className="pagination__ellipsis">...</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          onClick={() => onGoToPage(page)}
          className={`pagination__button ${
            currentPage === page ? "pagination__button--active" : ""
          }`}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="pagination__ellipsis">...</span>
          )}
          <Button
            onClick={() => onGoToPage(totalPages)}
            className={`pagination__button ${
              currentPage === totalPages ? "pagination__button--active" : ""
            }`}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        onClick={onNext}
        disabled={!hasNextPage}
        className="pagination__button"
      >
        Next
      </Button>

      <span className="pagination__meta">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
