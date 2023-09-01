import React from 'react'
import './style.scss'

export class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  // @ts-ignore
  static getDerivedStateFromError(error) {
    console.log(error)
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  // @ts-ignore
  // eslint-disable-next-line handle-callback-err
  componentDidCatch(error, info) {
    // Example "componentStack":
    //   in ComponentThatThrows (created by App)
    //   in ErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    // logErrorToMyService(error, info.componentStack);
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <h1 className='text-center error-boundary'>
          Something went wrong. Please reload and try again.
        </h1>
      )
    }

    // @ts-ignore
    return this.props.children
  }
}
