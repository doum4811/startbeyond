import { useSearchParams } from "react-router";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from "~/common/components/ui/pagination";

interface CommunityPaginationProps {
  totalPages: number;
}

export function CommunityPagination({ totalPages }: CommunityPaginationProps) {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return { search: params.toString() };
  };
  
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination>
      <PaginationContent>
        {page !== 1 && (
          <>
            <PaginationItem>
              <PaginationPrevious to={createPageURL(page - 1)} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink to={createPageURL(page - 1)}>
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        <PaginationItem>
          <PaginationLink to={createPageURL(page)} isActive>
            {page}
          </PaginationLink>
        </PaginationItem>
        {page !== totalPages && (
          <>
            <PaginationItem>
              <PaginationLink to={createPageURL(page + 1)}>
                {page + 1}
              </PaginationLink>
            </PaginationItem>
            {page + 1 < totalPages && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext to={createPageURL(page + 1)} />
            </PaginationItem>
          </>
        )}
      </PaginationContent>
    </Pagination>
  );
} 