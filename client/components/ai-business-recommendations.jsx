import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert } from './ui/alert';
import { EmptyState } from './ui/empty-state';
import aiService from '../services/ai.service';
import { RecommendationCard, RecommendationCardSkeleton } from './recommendation-card';

export function AIBusinessRecommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    aiService
      .getRecommendations()
      .then((res) => {
        if (active) {
          setRecommendations(res.data || []);
          setError(null);
        }
      })
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const handleApply = async (id) => {
    setRecommendations((prev) => prev.filter((r) => r._id !== id));
    try {
      await aiService.actionRecommendation(id, 'apply');
    } catch {
      // silent — optimistic update
    }
  };

  const handleDismiss = async (id) => {
    setRecommendations((prev) => prev.filter((r) => r._id !== id));
    try {
      await aiService.actionRecommendation(id, 'dismiss');
    } catch {
      // silent — optimistic update
    }
  };

  const handleViewDetails = () => {
    navigate('/inventory');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <RecommendationsHeading />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="error" title="Failed to load recommendations">
          Please try refreshing the page or check your connection.
        </Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <RecommendationsHeading count={recommendations.length} />

      {recommendations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No recommendations"
              description="Inventory is optimized. We'll notify you when AI identifies new opportunities."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((rec, index) => (
            <RecommendationCard
              key={rec._id}
              rec={rec}
              index={index}
              onApply={() => handleApply(rec._id)}
              onDismiss={() => handleDismiss(rec._id)}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationsHeading({ count }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          AI recommendations
        </h2>
        <p className="text-sm text-muted-foreground">Next best actions to optimize your inventory.</p>
      </div>
      {count > 0 && <Badge variant="info">{count} open</Badge>}
    </div>
  );
}
