// assets
import { IconCalendarEvent, IconUpload, IconCalculator, IconSend, IconFileInfo} from '@tabler/icons-react';

// constant
const icons = {
  IconCalendarEvent,
  IconUpload,
  IconCalculator,
  IconSend,
  IconFileInfo
};

// ==============================|| EXTRA PAGES MENU ITEMS ||============================== //

const Layanan = {
  id: 'Layanan',
  title: 'Layanan',
  caption: 'Layanan Test dan Non Test',
  icon: icons.IconCalendarEvent,
  type: 'group',
  children: [
    {
      id: 'Penjadwalan',
      title: 'Penjadwalan',
      type: 'collapse',
      icon: icons.IconCalendarEvent,
      children: [
        {
          id: 'Jadwal Test',
          title: 'Jadwal Test',
          type: 'item',
          url: '/pages/jadwal-test',
          target: true
        },
        {
          id: 'Jadwal Remedial',
          title: 'Jadwal Remedial',
          type: 'item',
          url: '/pages/jadwal-remedial',
          target: true
        },
        {
          id: 'Jadwal Kursus',
          title: 'Jadwal Kursus',
          type: 'item',
          url: '/pages/jadwal-kursus',
          target: true
        }
      ]
    },
    {
      id: 'Hasil Test',
      title: 'Hasil Test',
      type: 'collapse',
      icon: icons.IconUpload,
      children: [
        {
          id: 'TOEFL',
          title: 'TOEFL',
          type: 'item',
          url: '/pages/toefl',
          target: true
        },
        {
          id: 'SSPECT',
          title: 'SSPECT',
          type: 'item',
          url: '/pages/sspect',
          target: true
        },
        {
          id: 'TOIEC',
          title: 'TOIEC',
          type: 'item',
          url: '/pages/toiec',
          target: true
        }
      ]
    },
    {
      id: 'Kalkulasi Score',
      title: 'Kalkulasi Score',
      type: 'collapse',
      icon: icons.IconCalculator,
      children: [
        {
          id: 'Konversi',
          title: 'Konversi',
          type: 'item',
          url: '/pages/konversi',
          target: true
        }
      ]
    },
    {
      id: 'Pengajuan',
      title: 'Pengajuan',
      type: 'collapse',
      icon: icons.IconSend,
      children: [
        {
          id: 'Pengajuan Approval',
          title: 'Pengajuan Approval',
          type: 'item',
          url: '/pages/pengajuan-approval',
          target: true
        }
      ]
    },
    {
      id: 'Pusat Informasi',
      title: 'Pusat Informasi',
      type: 'collapse',
      icon: icons.IconFileInfo,
      children: [
        {
          id: 'Pengumuman',
          title: 'Pengumuman',
          type: 'item',
          url: '/pages/pengumuman',
          target: true
        }
      ]
    }
  ]
};

export default Layanan;