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
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        gap: "8px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Button
        onClick={onPrev}
        disabled={!hasPrevPage}
        style={{ padding: "8px 12px" }}
      >
        ← Previous
      </Button>

      {adjustedStart > 1 && (
        <>
          <Button
            onClick={() => onGoToPage(1)}
            style={{
              padding: "8px 12px",
              backgroundColor: currentPage === 1 ? "#4CAF50" : undefined,
            }}
          >
            1
          </Button>
          {adjustedStart > 2 && <span style={{ color: "#999" }}>...</span>}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          onClick={() => onGoToPage(page)}
          style={{
            padding: "8px 12px",
            backgroundColor: currentPage === page ? "#4CAF50" : undefined,
            fontWeight: currentPage === page ? "bold" : "normal",
          }}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={{ color: "#999" }}>...</span>}
          <Button
            onClick={() => onGoToPage(totalPages)}
            style={{
              padding: "8px 12px",
              backgroundColor: currentPage === totalPages ? "#4CAF50" : undefined,
            }}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        onClick={onNext}
        disabled={!hasNextPage}
        style={{ padding: "8px 12px" }}
      >
        Next →
      </Button>

      <span style={{ marginLeft: "auto", color: "#666" }}>
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
