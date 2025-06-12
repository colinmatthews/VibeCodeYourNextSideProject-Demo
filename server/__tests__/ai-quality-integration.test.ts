import request from 'supertest';
import express from 'express';
import { registerAIRoutes } from '../routes/aiRoutes.js';

const app = express();
app.use(express.json());
registerAIRoutes(app);

describe('AI Routes Quality Integration', () => {
  describe('POST /api/components/validate', () => {
    test('should validate component code and return quality scores', async () => {
      const sampleCode = `
        function TestComponent() {
          const [count, setCount] = useState(0);
          return (
            <div className="p-4 bg-white">
              <button onClick={() => setCount(count + 1)}>
                Count: {count}
              </button>
            </div>
          );
        }
        render(<TestComponent />);
      `;

      const response = await request(app)
        .post('/api/components/validate')
        .send({ code: sampleCode })
        .expect(200);

      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('qualityScore');
      
      expect(response.body.qualityScore).toHaveProperty('codeQuality');
      expect(response.body.qualityScore).toHaveProperty('accessibility');
      expect(response.body.qualityScore).toHaveProperty('designConsistency');
      expect(response.body.qualityScore).toHaveProperty('performance');
      expect(response.body.qualityScore).toHaveProperty('overall');
    });

    test('should return 400 for missing code parameter', async () => {
      const response = await request(app)
        .post('/api/components/validate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('code (string) is required');
    });

    test('should handle invalid code gracefully', async () => {
      const invalidCode = 'invalid javascript code {{{';

      const response = await request(app)
        .post('/api/components/validate')
        .send({ code: invalidCode })
        .expect(200);

      expect(response.body).toHaveProperty('isValid', false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/components/:id/rating', () => {
    test('should accept valid component rating', async () => {
      const componentId = 'test-component-123';
      const rating = 4;

      const response = await request(app)
        .put(`/api/components/${componentId}/rating`)
        .send({ rating })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('componentId', componentId);
      expect(response.body).toHaveProperty('rating', rating);
    });

    test('should reject invalid rating values', async () => {
      const componentId = 'test-component-123';
      
      // Test rating too low
      await request(app)
        .put(`/api/components/${componentId}/rating`)
        .send({ rating: 0 })
        .expect(400);

      // Test rating too high
      await request(app)
        .put(`/api/components/${componentId}/rating`)
        .send({ rating: 6 })
        .expect(400);

      // Test non-numeric rating
      await request(app)
        .put(`/api/components/${componentId}/rating`)
        .send({ rating: 'invalid' })
        .expect(400);
    });
  });

  describe('GET /api/admin/quality-metrics', () => {
    test('should return quality metrics structure', async () => {
      const response = await request(app)
        .get('/api/admin/quality-metrics')
        .expect(200);

      expect(response.body).toHaveProperty('totalComponents');
      expect(response.body).toHaveProperty('averageQualityScore');
      expect(response.body).toHaveProperty('averageUserRating');
      expect(response.body).toHaveProperty('qualityTrends');
      expect(response.body).toHaveProperty('componentsByType');
      expect(response.body).toHaveProperty('validationStats');
    });
  });

  describe('GET /api/ai/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('providers');
      expect(response.body).toHaveProperty('activeProvider');
    });
  });
});