'use client'

import { DataTypeSelector } from '@/components/DataTypeSelector'
import { DropZone } from '@/components/DropZone'

export default function Home() {
  return (
    <main className="items-center justify-between p-12">
      <DropZone/>
      <DataTypeSelector />
    </main>
  )
}
