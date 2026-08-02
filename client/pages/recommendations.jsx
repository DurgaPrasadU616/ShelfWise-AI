import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import aiService from '../services/ai.service';
import { PageHeader } from '../components/ui/page-header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { Alert } from '../components/ui/alert';
import { RecommendationCard, RecommendationCardSkeleton } from '../components/recommendation-card';

export default function Recommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await aiService.getRecommendations();
      setRecommendations(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await aiService.triggerAiAnalysis();
      await fetchRecommendations();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to trigger AI analysis');
    } finally {
      setIsGenerating(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Recommendations"
        description="Actionable insights driven by ShelfWise AI."
        icon={<Sparkles className="h-5 w-5" />}
      >
        <Button onClick={handleGenerate} disabled={isGenerating} loading={isGenerating}>
          {!isGenerating && <Zap className="h-4 w-4" />}
          {isGenerating ? 'Analyzing…' : 'Run Analysis Now'}
        </Button>
      </PageHeader>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="You're all caught up"
              description="Our AI hasn't found any pressing issues with your inventory. Run a fresh analysis to double-check."
              action={
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating} loading={isGenerating}>
                  {!isGenerating && <Zap className="h-4 w-4" />}
                  {isGenerating ? 'Analyzing…' : 'Run Analysis Now'}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
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
