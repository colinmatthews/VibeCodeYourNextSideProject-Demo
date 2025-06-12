import { 
  validateGeneratedCode,
  validateTypeScript,
  validateAccessibility,
  calculateCodeQuality,
  calculateDesignConsistency,
  calculatePerformance
} from '../lib/quality-validation.js';

describe('Quality Validation System', () => {
  describe('TypeScript Validation', () => {
    test('should validate correct TypeScript code', () => {
      const validCode = `
        function TestComponent() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;
      
      const result = validateTypeScript(validCode);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect TypeScript errors', () => {
      const invalidCode = `
        function TestComponent() {
          const count: string = 123; // Type error
          return <div>{count}</div>;
        }
      `;
      
      const result = validateTypeScript(invalidCode);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility Validation', () => {
    test('should detect missing alt text on images', () => {
      const codeWithImages = `
        function TestComponent() {
          return <div><img src="test.jpg" /></div>;
        }
      `;
      
      const result = validateAccessibility(codeWithImages);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('accessibility');
      expect(result.errors[0].message).toContain('alt text');
    });

    test('should pass for accessible images', () => {
      const accessibleCode = `
        function TestComponent() {
          return <div><img src="test.jpg" alt="Test description" /></div>;
        }
      `;
      
      const result = validateAccessibility(accessibleCode);
      expect(result.errors.filter(e => e.message.includes('alt text'))).toHaveLength(0);
    });
  });

  describe('Code Quality Scoring', () => {
    test('should score high-quality code well', () => {
      const goodCode = `
        function WellWrittenComponent() {
          const [data, setData] = useState([]);
          
          const handleClick = useCallback(() => {
            setData(prev => [...prev, 'new item']);
          }, []);
          
          return (
            <div className="p-4 bg-white">
              <button onClick={handleClick}>Add Item</button>
            </div>
          );
        }
        render(<WellWrittenComponent />);
      `;
      
      const score = calculateCodeQuality(goodCode, { isValid: true, errors: [] });
      expect(score).toBeGreaterThan(70);
    });

    test('should score poor-quality code lower', () => {
      const poorCode = `
        function PoorComponent() {
          // Very long component with many issues
          ${'const line = "filler";'.repeat(100)}
          return <div></div>;
        }
      `;
      
      const score = calculateCodeQuality(poorCode, { isValid: false, errors: [{ type: 'typescript', message: 'error', severity: 'error' }] });
      expect(score).toBeLessThan(50);
    });
  });

  describe('Design Consistency Scoring', () => {
    test('should score Tailwind-styled components well', () => {
      const tailwindCode = `
        function StyledComponent() {
          return (
            <div className="p-4 m-2 bg-white rounded-lg shadow-md sm:p-6 md:p-8">
              <h1 className="text-2xl font-bold text-gray-900">Title</h1>
            </div>
          );
        }
      `;
      
      const score = calculateDesignConsistency(tailwindCode);
      expect(score).toBeGreaterThan(80);
    });

    test('should score unstyled components lower', () => {
      const unstyledCode = `
        function UnstyledComponent() {
          return <div>No styling here</div>;
        }
      `;
      
      const score = calculateDesignConsistency(unstyledCode);
      expect(score).toBeLessThan(60);
    });
  });

  describe('Performance Scoring', () => {
    test('should score optimized components well', () => {
      const optimizedCode = `
        function OptimizedComponent() {
          const data = useMemo(() => expensiveCalculation(), []);
          const handler = useCallback(() => {}, []);
          return <div onClick={handler}>{data}</div>;
        }
      `;
      
      const score = calculatePerformance(optimizedCode);
      expect(score).toBeGreaterThan(80);
    });

    test('should score unoptimized components lower', () => {
      const unoptimizedCode = `
        function UnoptimizedComponent() {
          const data = JSON.parse(JSON.stringify({}));
          return <div onClick={() => {}}>{data}</div>;
        }
      `;
      
      const score = calculatePerformance(unoptimizedCode);
      expect(score).toBeLessThan(70);
    });
  });

  describe('Complete Validation', () => {
    test('should provide comprehensive validation results', async () => {
      const sampleCode = `
        function SampleComponent() {
          const [count, setCount] = useState(0);
          
          return (
            <div className="p-4 bg-white rounded">
              <button 
                onClick={() => setCount(count + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Count: {count}
              </button>
            </div>
          );
        }
        render(<SampleComponent />);
      `;
      
      const result = await validateGeneratedCode(sampleCode);
      
      expect(result.qualityScore).toBeDefined();
      expect(result.qualityScore.overall).toBeGreaterThan(0);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(100);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});