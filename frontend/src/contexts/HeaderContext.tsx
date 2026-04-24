import { createContext, useContext, useState, type ReactNode } from 'react'

interface HeaderConfig {
  title?: string
  showBackButton?: boolean
  customLeft?: ReactNode
  customRight?: ReactNode
}

interface HeaderContextType {
  config: HeaderConfig
  setConfig: (config: HeaderConfig) => void
  clearConfig: () => void
}

const defaultConfig: HeaderConfig = {
  showBackButton: false,
}

const HeaderContext = createContext<HeaderContextType>({
  config: defaultConfig,
  setConfig: () => {},
  clearConfig: () => {},
})

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<HeaderConfig>(defaultConfig)

  const setConfig = (newConfig: HeaderConfig) => {
    setConfigState(newConfig)
  }

  const clearConfig = () => {
    setConfigState(defaultConfig)
  }

  return (
    <HeaderContext.Provider value={{ config, setConfig, clearConfig }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  return useContext(HeaderContext)
}
