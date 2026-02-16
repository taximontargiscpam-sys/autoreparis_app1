import * as React from 'react';
import { act } from 'react';
import renderer from 'react-test-renderer';

import { MonoText } from '../StyledText';

it(`renders correctly`, () => {
  let tree;
  act(() => {
    tree = renderer.create(<MonoText>Snapshot test!</MonoText>);
  });

  expect(tree.toJSON()).toMatchSnapshot();
});
