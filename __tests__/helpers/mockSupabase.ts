/**
 * Creates a fully chainable Supabase mock.
 * The chain object is thenable so `await supabase.from('x').select().eq()` works.
 * Call chain._setResolved(value) to control what `await` returns.
 */
export function createChainableMock() {
  let resolvedValue: any = { data: null, error: null, count: 0 };

  const chain: any = {};

  const methods = [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'or', 'in', 'gte', 'lte', 'lt',
    'order', 'range', 'single', 'maybeSingle',
  ];

  for (const method of methods) {
    chain[method] = jest.fn(() => chain);
  }

  // Make chain thenable so await works
  chain.then = (resolve: any, reject?: any) => {
    return Promise.resolve(resolvedValue).then(resolve, reject);
  };

  chain._setResolved = (value: any) => {
    resolvedValue = value;
  };

  return chain;
}
