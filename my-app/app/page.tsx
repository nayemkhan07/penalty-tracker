// import DashboardLayout from '../Component/DashboardLayout';
// import PenaltyEntries from '@/Component/PenaltyEntries';
// import MemberSummary from '@/Component/Summery'



// export default function Homies() {
//   return (
//     <DashboardLayout>

//       <PenaltyEntries />

//       <MemberSummary />

//     </DashboardLayout>

//   );
// }

import DashboardLayout from '../Component/DashboardLayout';
import DashboardSummary from '@/Component/DashboardSummary'

export default function Home() {
    return (
        <DashboardLayout>
            <DashboardSummary />

        </DashboardLayout>
    );
}