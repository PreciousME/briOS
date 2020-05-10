import * as React from 'react'
import Page from '~/components/Page'
import { H3 } from '~/components/Typography'
import { NextSeo } from 'next-seo'
import { useGetBookmarksQuery } from '~/graphql/types.generated'
import BookmarksList from '~/components/Bookmarks'
import { GET_BOOKMARKS } from '~/graphql/queries'
import { useAuth } from '~/hooks/useAuth'
import AddBookmark from '~/components/Bookmarks/AddBookmark'
import { initApolloClient } from '~/graphql/services/apollo'
import { withApollo } from '~/components/withApollo'
import Grid from '~/components/Grid'
import FullscreenLoading from '~/components/FullscreenLoading'

function Bookmarks() {
  // pre-populate bookmarks from the cache, but check for any new ones after
  // the page loads
  const { data, fetchMore } = useGetBookmarksQuery({
    fetchPolicy: 'cache-and-network',
  })
  const { isMe } = useAuth()

  // this can happen if the route is navigated to from the client or if the
  // cache fails to populate for whatever reason
  if (!data || !data.bookmarks) return <FullscreenLoading />

  const { bookmarks } = data

  return (
    <Page withHeader>
      <NextSeo
        title={'Bookmarks'}
        description={'Internet things, saved for later.'}
        openGraph={{
          url: 'https://brianlovin.com/bookmarks',
          title: 'Bookmarks',
          description: 'Internet things, saved for later.',
          images: [
            {
              url: 'https://brianlovin.com/static/meta/bookmarks.png',
              alt: 'Bookmarks',
            },
          ],
        }}
      />
      <Grid
        columns={'fit-content(640px)'}
        style={{ justifyContent: 'center' }}
        data-cy="bookmarks"
      >
        <Grid gap={32}>
          <H3>Bookmarks</H3>
          {isMe && <AddBookmark />}
          {bookmarks && (
            <BookmarksList fetchMore={fetchMore} bookmarks={bookmarks} />
          )}
        </Grid>
      </Grid>
    </Page>
  )
}

export async function getStaticProps() {
  const client = await initApolloClient({})
  await client.query({ query: GET_BOOKMARKS })
  /*
    Because this is using withApollo, the data from this query will be
    pre-populated in the Apollo cache at build time. When the user first
    visits this page, we can retreive the data from the cache like this:

    const { data } = useGetBookmarksQuery({ fetchPolicy: 'cache-and-network' })

    This preserves the ability for the page to render all bookmarks instantly,
    then get progressively updated if any new bookmarks come in over the wire.
  */
  const apolloStaticCache = client.cache.extract()
  return {
    // because this data is slightly more dynamic, update it every hour
    unstable_revalidate: 60 * 60,
    props: {
      apolloStaticCache,
    },
  }
}

export default withApollo(Bookmarks)
