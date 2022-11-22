// // TabBar.tsx
// interface TabListProps<T> {
//     items: T[]
//     selectedItem: T
//     onTabClick: (item: T, selectedIndex: number) => void
//   }
  
//   export function TabList<T extends { id: number, name: string}>(props: TabListProps<T>) {
//     const { items, selectedItem, onTabClick} = props;

//     <div role="tablist">
//                 {items.map((item, idx) => {
//                     return (
//                         <JobTab
//                             id={`${ID(job.internalId)}-tab`}
//                             tabpanelId={`${ID(job.internalId)}-tabpanel`}
//                             label={
//                                 job.state == JobState.NEW
//                                     ? 'New Job'
//                                     : job.jobData.nicename
//                             }
//                             key={idx}
//                             isSelected={job.internalId == selectedJobId}
//                             onSelect={handleOnTabSelect}
//                             onClose={handleOnCloseTab}
//                         />
//                     )
//                 })}
//                 <AddJobTab onSelect={addJob} />
//             </div>

//     return (
//       <>
//         <div className="flex gap-x-3">
//           {
//             items.map((item, index) => {
//               const activeCls = item.id === selectedItem.id ? 'bg-slate-500 text-white' : ' bg-slate-200';
//               return <div
//                   key={item.id}
//                   className={'py-2 px-4 rounded ' + activeCls}
//                   onClick={() => onTabClick(item, index)}
//                 >
//                   {item.name}
//                 </div>
//               }
//             )
//           }
//         </div>
//       </>
//     )
//   }
  
  