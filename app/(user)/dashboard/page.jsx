import { DashboardLayoutNew } from '@/components/user-dashboard/dashboard-layout-new'
import React from 'react'
// import {fetchListingsByUserId} from '@/actions/lists'

export const metadata = {
  title: 'Dashboard',
}

const UserDashboard = async () => {
  
  return (
    <>
      <DashboardLayoutNew />
    </>
  )
}

export default UserDashboard