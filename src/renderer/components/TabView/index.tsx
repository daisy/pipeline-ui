/*
Generic tab view component with tab list and tab panels
Support for adding and removing tabs as well as submiting updates from within the tab panel
*/
import { useState } from 'react'
import { ID } from 'renderer/utils/utils'

interface TabViewProps<T> {
    items: T[]
    ItemTab: React.FunctionComponent<ItemTabProps<T>>
    AddItemTab: React.FunctionComponent<AddItemTabProps<T>>
    ItemTabPanel: React.FunctionComponent<ItemTabPanelProps<T>>
    onTabClose: Function
    onTabCreate: Function
    updateItem: Function
}

interface ItemTabProps<T> {
    item: T
    id: string
    tabpanelId: string
    isSelected: boolean
    onSelect: Function
    onClose: Function
}

interface AddItemTabProps<T> {
    onSelect: Function
}

interface ItemTabPanelProps<T> {
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
    if (selectedItemId == '' && items.length > 0 && items[0].internalId) {
        setSelectedItemId(items[0].internalId)
    }

    let onTabSelect = (item) => {
        console.log('Select ', item)
        setSelectedItemId(item.internalId)
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
                        onClose={onTabClose}
                    />
                ))}
                <AddItemTab onSelect={onTabCreate} />
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
