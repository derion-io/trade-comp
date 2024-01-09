export const fetch24hChange = async ({
  pairAddress,
  gtID
}: {
    pairAddress: string
    gtID: string
  }) => {
  const data = await fetch(`https://api.geckoterminal.com/api/v2/networks/${gtID}/pools/${pairAddress}`)
  const res = await data.json()
  return res.data?.attributes?.price_change_percentage as { h1: string, h24: string }
}
