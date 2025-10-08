import { useMemo } from 'react'
import { ModernSidebarItem } from '../types/sidebar.types'

export const useSidebarSearch = (items: ModernSidebarItem[], searchTerm: string) => {
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return items
    }

    const searchLower = searchTerm.toLowerCase()
    
    const filterRecursive = (itemList: ModernSidebarItem[]): ModernSidebarItem[] => {
      return itemList.reduce((acc: ModernSidebarItem[], item) => {
        // Verificar si el item actual coincide con la búsqueda
        const itemMatches = item.label.toLowerCase().includes(searchLower)
        
        // Si es un dropdown, verificar sus hijos
        if (item.type === 'dropdown' && item.children) {
          const filteredChildren = filterRecursive(item.children)
          
          // Si el item padre coincide o tiene hijos que coinciden
          if (itemMatches || filteredChildren.length > 0) {
            acc.push({
              ...item,
              children: filteredChildren.length > 0 ? filteredChildren : item.children
            })
          }
        } else if (itemMatches) {
          // Para items simples, solo agregar si coincide
          acc.push(item)
        }
        
        return acc
      }, [])
    }

    return filterRecursive(items)
  }, [items, searchTerm])

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        totalResults: 0,
        hasResults: false,
        highlightedItems: []
      }
    }

    let totalResults = 0
    const highlightedItems: Array<{ item: ModernSidebarItem; path: string[] }> = []

    const countRecursive = (itemList: ModernSidebarItem[], path: string[] = []) => {
      itemList.forEach(item => {
        const currentPath = [...path, item.label]
        
        if (item.label.toLowerCase().includes(searchTerm.toLowerCase())) {
          totalResults++
          highlightedItems.push({ item, path: currentPath })
        }
        
        if (item.type === 'dropdown' && item.children) {
          countRecursive(item.children, currentPath)
        }
      })
    }

    countRecursive(filteredItems)

    return {
      totalResults,
      hasResults: totalResults > 0,
      highlightedItems
    }
  }, [filteredItems, searchTerm])

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  const getSearchSuggestions = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      return []
    }

    const suggestions: string[] = []
    
    const extractSuggestions = (itemList: ModernSidebarItem[]) => {
      itemList.forEach(item => {
        const label = item.label.toLowerCase()
        const search = searchTerm.toLowerCase()
        
        // Sugerir palabras que empiecen con el término de búsqueda
        if (label.startsWith(search) && !suggestions.includes(item.label)) {
          suggestions.push(item.label)
        }
        
        // Sugerir palabras que contengan el término
        if (label.includes(search) && !suggestions.includes(item.label)) {
          suggestions.push(item.label)
        }
        
        if (item.type === 'dropdown' && item.children) {
          extractSuggestions(item.children)
        }
      })
    }

    extractSuggestions(items)
    
    return suggestions.slice(0, 5) // Máximo 5 sugerencias
  }, [items, searchTerm])

  return {
    filteredItems,
    searchResults,
    highlightSearchTerm,
    getSearchSuggestions
  }
}