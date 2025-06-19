import React from 'react';
import FeedComponent from '../Feed/Feed';

const ExploreFeed = React.memo(() => {
  return <FeedComponent exploreMode={true} />;
});

ExploreFeed.displayName = 'ExploreFeed';

export default ExploreFeed; 