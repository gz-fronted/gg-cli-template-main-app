import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useMicroAppTabs } from '../../micro-apps/tabs';
vi.mock('@/micro-apps/bootstrap', () => ({
  microAppDefinitions: [
    { name: 'a', basename: '/a', entry: '/a.html' },
    { name: 'b', basename: '/b', entry: '/b.html' },
  ],
}));
vi.mock('@/components/MicroAppHost', () => ({
  default: ({
    definition,
    routePath,
    active,
  }: {
    definition: { name: string };
    routePath: string;
    active: boolean;
  }) => <div data-testid={definition.name}>{`${active}:${routePath}`}</div>,
}));
vi.mock('antd', () => ({
  Tabs: ({
    items,
    onChange,
    onEdit,
  }: {
    items: { key: string }[];
    onChange: (key: string) => void;
    onEdit: (key: string, action: string) => void;
  }) => (
    <div>
      {items.map((item) => (
        <div key={item.key}>
          <button onClick={() => onChange(item.key)}>{item.key}</button>
          <button onClick={() => onEdit(item.key, 'remove')}>close-{item.key}</button>
        </div>
      ))}
    </div>
  ),
}));
import MicroAppTabs from './index';
function Harness() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/b/list?old=1')}>open-b</button>
      <button onClick={() => navigate('/a/detail?id=2')}>new-query</button>
      <button onClick={() => navigate('/a/detail')}>clear-query</button>
      <MicroAppTabs />
    </>
  );
}
beforeEach(() => useMicroAppTabs.getState().reset());
it('preserves inactive panels and replaces the complete route before activation', async () => {
  render(
    <MemoryRouter initialEntries={['/a/detail?id=1']}>
      <Harness />
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByTestId('a').textContent).toBe('true:/detail?id=1'));
  fireEvent.click(screen.getByText('open-b'));
  await waitFor(() => expect(screen.getByTestId('b').textContent).toBe('true:/list?old=1'));
  expect(screen.getByTestId('a').textContent).toBe('false:/detail?id=1');
  fireEvent.click(screen.getByText('new-query'));
  await waitFor(() => expect(screen.getByTestId('a').textContent).toBe('true:/detail?id=2'));
  expect(
    useMicroAppTabs.getState().tabs.find((tab) => tab.definition.name === 'a')?.routePath,
  ).toBe('/detail?id=2');
  fireEvent.click(screen.getByText('clear-query'));
  await waitFor(() => expect(screen.getByTestId('a').textContent).toBe('true:/detail'));
  fireEvent.click(screen.getByText('close-a'));
  await waitFor(() => expect(screen.queryByTestId('a')).toBeNull());
  expect(screen.getByTestId('b').textContent).toBe('true:/list?old=1');
});
it('rejects inactive and external child route messages', async () => {
  render(
    <MemoryRouter initialEntries={['/a/detail']}>
      <Harness />
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByTestId('a')).toBeTruthy());
  act(() =>
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        origin: 'https://external.example',
        data: { type: 'pilotcore:subapp-route-change', appId: 'a', routePath: '/bad' },
      }),
    ),
  );
  expect(screen.getByTestId('a').textContent).toBe('true:/detail');
  act(() =>
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        origin: window.location.origin,
        data: { type: 'pilotcore:subapp-route-change', appId: 'a', routePath: '/detail?id=3' },
      }),
    ),
  );
  await waitFor(() => expect(screen.getByTestId('a').textContent).toBe('true:/detail?id=3'));
});

it('unmounts an evicted panel while retaining its tab and restores it on activation', async () => {
  const definition = { name: 'a', basename: '/a', entry: '/a.html' };
  useMicroAppTabs.getState().visit(definition, '/detail?id=7');
  for (let i = 0; i < 10; i++)
    useMicroAppTabs
      .getState()
      .visit({ name: `extra-${i}`, basename: `/extra-${i}`, entry: '/entry' }, '/');
  render(
    <MemoryRouter initialEntries={['/']}>
      <MicroAppTabs />
    </MemoryRouter>,
  );
  expect(screen.queryByTestId('a')).toBeNull();
  expect(screen.getByText('a')).toBeTruthy();
  fireEvent.click(screen.getByText('a'));
  await waitFor(() => expect(screen.getByTestId('a').textContent).toBe('true:/detail?id=7'));
  expect(screen.queryByTestId('extra-0')).toBeNull();
  expect(screen.getByText('extra-0')).toBeTruthy();
  expect(useMicroAppTabs.getState().tabs).toHaveLength(11);
});
