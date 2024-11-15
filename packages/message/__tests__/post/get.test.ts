import { PostMessageClient } from '../../src'

describe('Post get tests', () => {
  const post = new PostMessageClient()

  it('should only get post from a specific channel', async () => {
    const channel = 'TEST'

    const amends = await post.getAll({
      types: [],
      pagination: 5,
      channels: [channel],
    })

    amends.posts.map((post) => {
      expect(post.channel).toStrictEqual(channel)
    })
  })

  it('should get a post with specific parameters', async () => {
    const content: { body: string } = {
      body: 'New content !',
    }

    const amends = await post.getAll({
      addresses: ['0xB68B9D4f3771c246233823ed1D3Add451055F9Ef'],
      hashes: ['7ffbfe7017b3f1010f2830cfa5b4391aefd78466a4300f47ab3f2645fab48cd4'],
    })

    expect(amends.posts[0].content).toStrictEqual(content)
  })
})
