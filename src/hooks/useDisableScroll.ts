import { useWindowSize } from './useWindowSize'

export const useDisableScroll = () => {
  const { width } = useWindowSize()
  const disableScroll = () => {
    if (width && width < 768) {
      // @ts-ignore
      document.getElementById('swap-page-interface').style.height = '1px'
    }
    // @ts-ignore
    document.getElementById('swap-page-interface').style.overflow = 'hidden'
  }

  const enableScroll = () => {
    // @ts-ignore
    document.getElementById('swap-page-interface').style.height = 'inherit'
    // @ts-ignore
    document.getElementById('swap-page-interface').style.overflow = 'auto'
  }

  return {
    disableScroll,
    enableScroll
  }
}
