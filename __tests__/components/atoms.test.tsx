import { fireEvent, render, screen } from '@testing-library/react-native';

import { Badge, CounterStepper, ViewToggle } from '@/components/atoms';

describe('Badge', () => {
  it('renders its label', async () => {
    await render(<Badge label="New" tone="primary" />);

    expect(screen.getByText('New')).toBeTruthy();
  });
});

describe('CounterStepper', () => {
  it('increments and decrements within min/max bounds', async () => {
    const onChange = jest.fn();
    await render(<CounterStepper label="Bedrooms" value={2} min={0} max={5} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Increase Bedrooms'));
    expect(onChange).toHaveBeenCalledWith(3);

    await fireEvent.press(screen.getByLabelText('Decrease Bedrooms'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables the decrement button at the minimum', async () => {
    const onChange = jest.fn();
    await render(<CounterStepper label="Bathrooms" value={0} min={0} max={5} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Decrease Bathrooms'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Any')).toBeTruthy();
  });

  it('disables the increment button at the maximum and shows a "+" suffix', async () => {
    const onChange = jest.fn();
    await render(<CounterStepper label="Bedrooms" value={5} min={0} max={5} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Increase Bedrooms'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('5+')).toBeTruthy();
  });
});

describe('ViewToggle', () => {
  it('calls onChange with the selected mode', async () => {
    const onChange = jest.fn();
    await render(<ViewToggle value="grid" onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('List view'));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
