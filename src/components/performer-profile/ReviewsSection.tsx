
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";

interface ReviewsSectionProps {
  profileId: string;
  currentUserRole: 'customer' | 'performer' | 'agency';
  currentCustomerId: string;
  currentCustomerName: string;
  onReviewSubmit: () => void;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  profileId,
  currentUserRole,
  currentCustomerId,
  currentCustomerName,
  onReviewSubmit,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ReviewList performerId={profileId} />
      {currentUserRole === 'customer' && (
        <Card>
          <CardHeader>
            <CardTitle>Оставить отзыв</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm
              performerId={profileId}
              customerId={currentCustomerId}
              customerName={currentCustomerName}
              onSubmitSuccess={onReviewSubmit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewsSection;
    