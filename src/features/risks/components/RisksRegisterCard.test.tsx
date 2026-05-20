import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RisksRegisterCard } from '@/features/risks/components/RisksRegisterCard';

describe('RisksRegisterCard', () => {
  it('applies print page-break utility on card content', () => {
    render(
      <RisksRegisterCard>
        <p>Register</p>
      </RisksRegisterCard>
    );
    expect(document.querySelector('.print\\:break-inside-avoid')).not.toBeNull();
  });
});
