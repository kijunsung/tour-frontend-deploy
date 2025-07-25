

import api from './api';
import { Notification } from '../types/notification';

// 알림 목록 가져오기
export const fetchNotifications = async (userId: number): Promise<Notification[]> => {
  const res = await api.get(`/notifications/user/${userId}`);
  return res.data;
};

// 알림 삭제 -> 읽음처리로 수정 (db에 기록이 남게끔하기) 이거 안쓰고 있음
export const deleteNotifications = async (ids: number[]) => {
  return api.delete(`/notifications`, { data: { ids } });
};

//  읽음 처리 API 함수 
export const markAsRead = async (noticeId: number): Promise<void> => {
  await api.patch(`/notifications/${noticeId}/read`);
};