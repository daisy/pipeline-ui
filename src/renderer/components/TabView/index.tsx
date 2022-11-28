/*
Generic tab view component with tab list and tab panels
Hooks for adding, removing, updating items
Implementation should provide custom display components for rendering tab and panel contents
*/
import { useState, useEffect } from 'react'
import { ID } from 'renderer/utils/utils'

export interface TabViewProps<T> {
    items: T[]
    ItemTab: React.FunctionComponent<ItemTabProps<T>>
    AddItemTab: React.FunctionComponent<AddItemTabProps<T>>
    ItemTabPanel: React.FunctionComponent<ItemTabPanelProps<T>>
    onTabClose: Function
    onTabCreate: Function
    updateItem: Function
}

export interface ItemTabProps<T> {
    item: T
    id: string
    tabpanelId: string
    isSelected: boolean
    onSelect: Function
    onClose: Function
}

export interface AddItemTabProps<T> {
    onSelect: Function
    onItemWasCreated: Function
}

export interface ItemTabPanelProps<T> {
    id: string
    tabId: string
    item: T
    isSelected: boolean
    updateItem: Function
}

export function TabView<T extends { internalId: string }>(
    props: TabViewProps<T>
) {
    const {
        items,
        ItemTab,
        AddItemTab,
        ItemTabPanel,
        onTabClose,
        onTabCreate,
        updateItem,
    } = props

    const [selectedItemId, setSelectedItemId] = useState('')
    useEffect(() => {
        console.log("use effect items", selectedItemId)
        if (selectedItemId == '' && items.length > 0 && items[0].internalId) {
            console.log("nothing selected")
            setSelectedItemId(items[0].internalId)
        }
    }, [items])

    let onTabSelect = (item) => {
        setSelectedItemId(item.internalId)
    }

    let onTabClose_ = (id) => {
        if (items.length > 1) {
            let newSelectedIndex = items.length - 2
            let newId = items[newSelectedIndex].internalId
            setSelectedItemId(newId)
            onTabClose(id)
        }
        else if (items.length == 1){
            onTabClose(id)
            setSelectedItemId(items[0].internalId)
        }
        else {
            setSelectedItemId('')
        }

    }

    // when a tab is created, its new ID is reported back here so it can be selected automatically
    let onItemWasCreated = (newId) => {
        setSelectedItemId(newId)
    }

    return (
        <>
            <div role="tablist">
                {items.map((item, idx) => (
                    <ItemTab
                        key={idx}
                        item={item}
                        id={`${ID(item.internalId)}-tab`}
                        tabpanelId={`${ID(item.internalId)}-tabpanel`}
                        isSelected={selectedItemId == item.internalId}
                        onSelect={onTabSelect}
                        onClose={(e) => onTabClose_(item.internalId)}
                    />
                ))}
                <AddItemTab
                    onSelect={onTabCreate}
                    onItemWasCreated={onItemWasCreated}
                />
            </div>
            {items.map((item, idx) => {
                return (
                    <ItemTabPanel
                        key={idx}
                        item={item}
                        id={`${ID(item.internalId)}-tabpanel`}
                        tabId={`${ID(item.internalId)}-tab`}
                        isSelected={selectedItemId == item.internalId}
                        updateItem={updateItem}
                    />
                )
            })}
        </>
    )
}
