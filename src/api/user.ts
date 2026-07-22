import { request } from '../utils/request';

// 定义接口返回的数据类型
export interface UserInfo {
  id: number;
  name: string;
  email: string;
}

// 示例 API 服务
export const userService = {
  // 获取用户信息
  getUserInfo: (userId: number) => {
    return request.get<UserInfo>(`/users/${userId}`);
  },

  // 更新用户信息
  updateUserInfo: (userId: number, data: Partial<UserInfo>) => {
    return request.put<UserInfo>(`/users/${userId}`, data);
  },
};
