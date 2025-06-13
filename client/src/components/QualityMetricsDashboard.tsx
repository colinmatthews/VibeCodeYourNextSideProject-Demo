/**
 * Phase 3: Quality Metrics Dashboard
 * Comprehensive analytics and insights for component quality trends
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  Target, 
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';
import { ReadOnlyComponentRating } from './ComponentRating';
import { SimpleQualityIndicator } from './QualityBadge';

interface QualityMetrics {
  overview: {
    totalComponents: number;
    ratedComponents: number;
    avgRating: number;
    avgQualityScore: number;
    avgAccessibilityScore: number;
  };
  distribution: {
    componentTypes: Record<string, number>;
    qualityScoreDistribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
  recentComponents: Array<{
    id: string;
    name: string;
    createdAt: string;
    qualityScore: number;
    userRating: number;
    accessibilityScore: number;
  }>;
}

interface QualityMetricsDashboardProps {
  userId: string;
  refreshInterval?: number; // in milliseconds
}

export function QualityMetricsDashboard({ 
  userId, 
  refreshInterval = 60000 // 1 minute default
}: QualityMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/quality-metrics?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quality metrics');
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up auto-refresh
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [userId, refreshInterval]);

  const exportMetrics = () => {
    if (!metrics) return;
    
    const data = {
      ...metrics,
      exportedAt: new Date().toISOString(),
      userId
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quality Metrics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quality Metrics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchMetrics} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const { overview, distribution, recentComponents } = metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Quality Metrics Dashboard
          </h2>
          {lastUpdated && (
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportMetrics} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Components</p>
                <p className="text-2xl font-bold">{overview.totalComponents}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Quality Score</p>
                <p className="text-2xl font-bold">{overview.avgQualityScore}/100</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg User Rating</p>
                <p className="text-2xl font-bold">{overview.avgRating}/5</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accessibility</p>
                <p className="text-2xl font-bold">{overview.avgAccessibilityScore}/100</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rated Components</p>
                <p className="text-2xl font-bold">{overview.ratedComponents}</p>
                <p className="text-xs text-gray-500">
                  {overview.totalComponents > 0 ? 
                    `${Math.round((overview.ratedComponents / overview.totalComponents) * 100)}%` : 
                    '0%'
                  }
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="recent">Recent Components</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Component Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Component Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(distribution.componentTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(count / overview.totalComponents) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-800">
                      Excellent (90-100)
                    </Badge>
                    <span className="text-sm font-medium">{distribution.qualityScoreDistribution.excellent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-100 text-blue-800">
                      Good (70-89)
                    </Badge>
                    <span className="text-sm font-medium">{distribution.qualityScoreDistribution.good}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Fair (50-69)
                    </Badge>
                    <span className="text-sm font-medium">{distribution.qualityScoreDistribution.fair}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-100 text-red-800">
                      Poor (&lt;50)
                    </Badge>
                    <span className="text-sm font-medium">{distribution.qualityScoreDistribution.poor}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Components</CardTitle>
            </CardHeader>
            <CardContent>
              {recentComponents.length > 0 ? (
                <div className="space-y-3">
                  {recentComponents.map((component) => (
                    <div 
                      key={component.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{component.name}</h4>
                        <p className="text-sm text-gray-600">
                          Created: {new Date(component.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Quality</p>
                          <SimpleQualityIndicator score={component.qualityScore} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Rating</p>
                          <ReadOnlyComponentRating 
                            rating={component.userRating} 
                            size="sm"
                            showNumeric={false}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">A11y</p>
                          <span className="text-sm font-medium">{component.accessibilityScore}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No components found. Start generating components to see metrics!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Quality Insights */}
                <div>
                  <h4 className="font-medium mb-3">Quality Insights</h4>
                  <div className="space-y-2 text-sm">
                    {overview.avgQualityScore >= 85 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        Excellent overall quality! Your components consistently meet high standards.
                      </div>
                    )}
                    {overview.avgQualityScore < 70 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <TrendingUp className="w-4 h-4" />
                        Quality scores below target. Focus on TypeScript best practices and accessibility.
                      </div>
                    )}
                    {overview.avgAccessibilityScore < 70 && (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Users className="w-4 h-4" />
                        Accessibility scores could be improved. Add ARIA labels and semantic HTML.
                      </div>
                    )}
                    {(overview.ratedComponents / overview.totalComponents) < 0.5 && overview.totalComponents > 5 && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Star className="w-4 h-4" />
                        Consider rating more components to help improve the AI generation quality.
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium mb-3">Recommendations</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• Generate components regularly to track quality trends over time</div>
                    <div>• Rate your components to help improve AI generation quality</div>
                    <div>• Focus on accessibility features for inclusive design</div>
                    <div>• Review validation errors to identify common improvement areas</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}