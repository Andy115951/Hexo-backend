---
title: algorithm
date: 2025-09-04 21:35:52
categories:
  - Algorithm
  - daily
tags:
---

# algo

### 待做题

[3297. 统计重新排列后包含另一个字符串的子字符串数目 I - 力扣（LeetCode）](https://leetcode.cn/problems/count-substrings-that-can-be-rearranged-to-contain-a-string-i/description/)

[3298. 统计重新排列后包含另一个字符串的子字符串数目 II - 力扣（LeetCode）](https://leetcode.cn/problems/count-substrings-that-can-be-rearranged-to-contain-a-string-ii/description/)

[76. 最小覆盖子串 - 力扣（LeetCode）](https://leetcode.cn/problems/minimum-window-substring/description/)

[2218. 从栈中取出 K 个硬币的最大面值和](https://leetcode.cn/problems/maximum-value-of-k-coins-from-piles/)

[2920. 收集所有金币可获得的最大积分 - 力扣（LeetCode）](https://leetcode.cn/problems/maximum-points-after-collecting-coins-from-all-nodes/description/)

[2944. 购买水果需要的最少金币数 - 力扣（LeetCode）](https://leetcode.cn/problems/minimum-number-of-coins-for-fruits/description/)

[1. 两数之和 - 力扣（LeetCode）](https://leetcode.cn/problems/two-sum/description/)

[151. 反转字符串中的单词 - 力扣（LeetCode）](https://leetcode.cn/problems/reverse-words-in-a-string/)

[459. 重复的子字符串 - 力扣（LeetCode）](https://leetcode.cn/problems/repeated-substring-pattern/description/)

[347. 前 K 个高频元素 - 力扣（LeetCode）](https://leetcode.cn/problems/top-k-frequent-elements/description/)

[1278. 分割回文串 III - 力扣（LeetCode）](https://leetcode.cn/problems/palindrome-partitioning-iii/description/)

### 速通

20

### 数组

#### 27. 移除元素

[27. 移除元素 - 力扣（LeetCode）](https://leetcode.cn/problems/remove-element/description/)

> 给你一个数组 nums 和一个值 val，你需要 原地 移除所有数值等于 val 的元素，并返回移除后数组的新长度。
> 不要使用额外的数组空间，你必须仅使用 O(1) 额外空间并**原地**修改输入数组。
> 元素的顺序可以改变。你不需要考虑数组中超出新长度后面的元素。
> 示例 1: 给定 nums = [3,2,2,3], val = 3, 函数应该返回新的长度 2, 并且 nums 中的前两个元素均为 2。 你不需要考虑数组中超出新长度后面的元素。
> 示例 2: 给定 nums = [0,1,2,2,3,0,4,2], val = 2, 函数应该返回新的长度 5, 并且 nums 中的前五个元素为 0, 1, 3, 0, 4。

> **你不需要考虑数组中超出新长度后面的元素。**

```cpp
class Solution {
public:
    int removeElement(vector<int>& nums, int val) {
        int n=nums.size();
        int left=0;
        for(int right=0;right<n;right++){
            if(nums[right]!=val){
                nums[left]=nums[right];
                left++;
            }
        }
        return left;}
};
```

```cpp
//zi
class Solution {
public:
    int removeElement(vector<int>& nums, int val) {
        int slow=0;
        for (int fast=0;fast<nums.size();++fast){
            if(nums[fast]!=val){
                nums[slow]=nums[fast];
                slow++;
            }
        }
        return slow;
    }
};
```

> 双指针，快慢指针，后覆盖前

#### 59.螺旋矩阵 II

[59. 螺旋矩阵 II - 力扣（LeetCode）](https://leetcode.cn/problems/spiral-matrix-ii/description/)

本题并不涉及到什么算法，就是模拟过程，但却十分考察对代码的掌控能力。

大家还记得我们在这篇文章[数组：每次遇到二分法，都是一看就会，一写就废 (opens new window)](https://programmercarl.com/0704.%E4%BA%8C%E5%88%86%E6%9F%A5%E6%89%BE.html)中讲解了二分法，提到如果要写出正确的二分法一定要坚持循环不变量原则。

而求解本题依然是要坚持循环不变量原则。

```cpp
class Solution {
public:
    vector<vector<int>> generateMatrix(int n) {
        vector<vector<int>>res(n,vector<int>(n,0));
        int startx = 0,starty = 0;
        int loop=n/2;
        int mid = n /2;
        int count=1;
        int offset=1;
        int i,j;
        while(loop--){
            i=startx;
            j=starty;
            for(;j<n-offset;++j){
                res[i][j]=count++;
            }
            for(;i<n-offset;i++){
                res[i][j]=count++;
            }
            for(;j>starty;--j){
                res[i][j]=count++;
            }
            for(;i>startx;--i){
                res[i][j]=count++;
            }
            startx++;
            starty++;
            offset+=1;
        }
        if(n%2){
            res[mid][mid]=count;
        }
        return res;
    }
};
```

自己写：

```cpp
class Solution {
public:
    vector<vector<int>> generateMatrix(int n) {
        int cnt=1;
        int x=0;
        int y=0;
        int hen=n;
        int shu=n;
        int cen=0;
        vector<vector<int> >ans(n, vector<int>(n, 0));
        int loop =n/2;
        while(loop--){
            while(x<n-cen-1){
                ans[y][x]=cnt;
                x++;
                cnt++;
            }
            while(y<n-cen-1){
                ans[y][x]=cnt;
                y++;
                cnt++;
            }
            while(x>cen){
                ans[y][x]=cnt;
                x--;
                cnt++;
            }
            while(y>cen){
                ans[y][x]=cnt;
                y--;
                cnt++;
            }
            cen++;
            x=cen;
            y=cen;

        }
        if(n%2==1){
            ans[y][x]=cnt;
        }
        return ans;
    }
};
```

#### 209.长度最小的子数组

[209. 长度最小的子数组 - 力扣（LeetCode）](https://leetcode.cn/problems/minimum-size-subarray-sum/description/)

```cpp
class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int sum = 0;
        int length = 100005;
        int i = 0;
        int len;
        for (int j = 0; j < nums.size(); ++j) {
            sum += nums[j];
            while (sum >= target) {
                len = j - i + 1;
                length = length < len ? length : len;
                sum -= nums[i];
                i++;
            }
        }
        return length == 100005 ? 0 : length;
    }
};
```

> 滑动窗口,将 j 设置为窗口终止位置，i 为窗口的起始位置

第一遍错:做的时候写成了 sum>target，当 sum 有==target 的条件时才是满足超过 target 的最小值

#### 

#### 704.二分查找

[704. 二分查找 - 力扣（LeetCode）](https://leetcode.cn/problems/binary-search/description/)

```cpp
class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left=0;
        int right=nums.size()-1;
        while (left <= right) { 
            int middle = left + ((right - left) / 2);
            if (nums[middle] > target) {
                right = middle - 1; 
            } else if (nums[middle] < target) {
                left = middle + 1; 
            } else { 
                return middle; 
            }
        }
        return -1;
    }
};
```

```cpp
//自
class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left=0;
        int right=nums.size()-1;
        while(left<=right){
            int mid=left+(right-left)/2;
            if(nums[mid]<target){
                left=mid+1;
            }
            else if (nums[mid]>target){
                right=mid-1;
            }else {
                target=mid;
                return target;
            }
        }
        return -1;
    }
};
```

> 左闭右开/左闭右闭注意判断边界条件

#### 977.有序数组的平方

[977. 有序数组的平方 - 力扣（LeetCode）](https://leetcode.cn/problems/squares-of-a-sorted-array/description/)

双指针

```cpp
class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        int n = nums.size() - 1;
        vector<int> result(nums.size(), 0);
        for (int i = 0, j = nums.size() - 1; i <= j;) { 
            if (nums[i] * nums[i] < nums[j] * nums[j])  {
                result[n--] = nums[j] * nums[j];
                j--;
            }
            else {
                result[n--] = nums[i] * nums[i];
                i++;
            }
        }
        return result;
    }
};
```

> 双指针

#### 1014.最佳观光组合

[1014. 最佳观光组合 - 力扣（LeetCode）](https://leetcode.cn/problems/best-sightseeing-pair/description/)

```cpp
class Solution {
public:
    int maxScoreSightseeingPair(vector<int>& values) {
        int sum_i_max=values[0]+0;
        int maxx=0;
        for(int j=1;j<values.size();++j){
            maxx=max(maxx,sum_i_max+values[j]-j);
            sum_i_max=max(sum_i_max,values[j]+j);
        }
        return maxx;
    }
};
```

> 遍历右，维护左

```java
class Solution {
    public int maxScoreSightseeingPair(int[] values) {
        int max_i=values[0]+0;
        int max_ans=0;
        for(int j =1;j<values.length;++j){
            max_ans=Math.max(max_ans,max_i+values[j]-j);
            max_i=Math.max(max_i,values[j]+j);
        }
        return max_ans;
    }
}
```

#### 1287. 有序数组中出现次数超过 25% 的元素

[1287. 有序数组中出现次数超过 25% 的元素 - 力扣（LeetCode）](https://leetcode.cn/problems/element-appearing-more-than-25-in-sorted-array/description/)

```cpp
class Solution {
public:
    int findSpecialInteger(vector<int>& arr) {
        int m = arr.size() / 4;
        for (int i : {m, m * 2 + 1}) {
            int x = arr[i];
            if (ranges::upper_bound(arr, x) - ranges::lower_bound(arr, x) > m) {
                return x;
            }
        }
        // 如果答案不是 arr[m] 也不是 arr[2m+1]，那么答案一定是 arr[3m+2]
        return arr[m * 3 + 2];
    }
};
```

#### 1706. 球会落何处

[1706. 球会落何处 - 力扣（LeetCode）](https://leetcode.cn/problems/where-will-the-ball-fall/description/)

模拟，循环

```cpp
class Solution {
public:
    vector<int> findBall(vector<vector<int>>& grid) {
        int n = grid[0].size();
        vector<int> ans(n);
        for (int j = 0; j < n; j++) {
            // 模拟第 j 列球的移动
            int cur_col = j; // 当前列号
            for (auto& row : grid) {
                int d = row[cur_col]; // -1 或 1，表示左/右
                cur_col += d; // 左/右走一步
                // 如果球出界或者卡在 V 形，退出循环，否则继续循环（垂直落入下一排）
                // V 形就是 -1 的左边是 1，1 的右边是 -1，即 row[cur_col] != d
                if (cur_col < 0 || cur_col == n || row[cur_col] != d) {
                    cur_col = -1;
                    break;
                }
            }
            ans[j] = cur_col;
        }
        return ans;
    }
};
```

#### 1760. 袋子里最少数目的球

[1760. 袋子里最少数目的球 - 力扣（LeetCode）](https://leetcode.cn/problems/minimum-limit-of-balls-in-a-bag/description/)

```cpp
class Solution {
public:
    int minimumSize(vector<int>& nums, int maxOperations) {
        auto check = [&](int m) -> bool {
            long long cnt = 0;
            for (int x : nums) {
                cnt += (x - 1) / m;
            }
            return cnt <= maxOperations;
        };

        int left = 0; // 循环不变量 check(left) == false
        int right = ranges::max(nums); // 循环不变量 check(right) == true
        while (left + 1 < right) {
            int mid = left + (right - left) / 2;
            (check(mid) ? right : left) = mid;
        }
        return right;
    }
};
```

#### 3127.构造相同颜色的正方形

[3127. 构造相同颜色的正方形](https://leetcode.cn/problems/make-a-square-with-the-same-color/)

```cpp
class Solution {
public:
    bool check(vector<vector<char>>& grid,int x,int y){
        int count=0;
        for(int i =0;i<2;++i){
            for(int j =0;j<2;++j){
                count+=(grid[x+i][y+j]=='B');
            }
        }
        return count!=2;
    }
    bool canMakeSquare(vector<vector<char>>& grid) {
        for(int i=0;i<2;++i){
            for(int j =0;j<2;++j){
                if(check(grid,i,j)){
                    return true;
                }
            }
        }
        return false;
    }
};
```

#### 3142.判断矩阵是否满足条件

[3142. 判断矩阵是否满足条件 - 力扣（LeetCode）](https://leetcode.cn/problems/check-if-grid-satisfies-conditions/submissions/559717254/)

```cpp
class Solution {
public:
    bool satisfiesConditions(vector<vector<int>>& grid) {
        int ihang;
        int jlie;
        ihang=grid.size();
        jlie=grid[0].size();
        for(int i =0;i<jlie-1;++i){//判断第一行
            if(grid[0][i]==grid[0][i+1]){
                return false;
            }
        }
        for(int i=1;i<ihang;++i){//判断后面几行
            for(int j =0;j<jlie;++j){
                if(grid[i][j]!=grid[i-1][j]){
                    return false;
                }
            }
        }
        return true;
    }
};
```

#### 3206. 交替组 I

[3206. 交替组 I - 力扣（LeetCode）](https://leetcode.cn/problems/alternating-groups-i/description/)

```cpp
class Solution {
public:
    int numberOfAlternatingGroups(vector<int>& colors) {
        int n = colors.size();
        int ans = 0, cnt = 0;
        for (int i = 0; i < n * 2; i++) {
            if (i > 0 && colors[i % n] == colors[(i - 1) % n]) {
                cnt = 0;
            }
            cnt++;
            ans += (i >= n && cnt >= 3);
        }
        return ans;
    }
};
```

> 环形复制一份，相邻不同 ans++

#### 3233.统计不是特殊数字的数字数量

[3233. 统计不是特殊数字的数字数量 - 力扣（LeetCode）](https://leetcode.cn/problems/find-the-count-of-numbers-which-are-not-special/submissions/582460767/)

```cpp
const int MX = 31622;
int pi[MX + 1];

auto init = [] {
    for (int i = 2; i <= MX; i++) {
        if (pi[i] == 0) { // i 是质数
            pi[i] = pi[i - 1] + 1;
            for (int j = i * i; j <= MX; j += i) { // 注：如果 MX 比较大，小心 i*i 溢出
                pi[j] = -1; // 标记 i 的倍数为合数
            }
        } else {
            pi[i] = pi[i - 1];
        }
    }
    return 0;
}();

class Solution {
public:
    int nonSpecialCount(int l, int r) {
        return r - l + 1 - (pi[(int) sqrt(r)] - pi[(int) sqrt(l - 1)]);
    }
};
```

> 并查集，求解[0,r]之内质数的数量

### 滑动窗口

#### 187. 重复的 DNA 序列

[187. 重复的 DNA 序列 - 力扣（LeetCode）](https://leetcode.cn/problems/repeated-dna-sequences/description/?envType=study-plan-v2&envId=2024-spring-sprint-100)

```cpp
class Solution {
public:
    vector<string> findRepeatedDnaSequences(string s) {
        unordered_map<string,int> cnt;
        vector <string>ans;
        for(int i =0,n=s.size()-10+1;i<n;++i){
            auto t=s.substr(i,10);
            if(++cnt[t]==2){
                ans.emplace_back(t);
            }
        }
        return ans;
    }
};
```

**substr（size_t pos，size_t len） 第一个字符位置 子字符串长度**

emplace_back

> **底层实现机制不同**
> [emplace_back](https://www.baidu.com/s?wd=emplace_back&tn=15007414_23_dg&usm=1&ie=utf-8&rsv_pq=cacff78901165187&oq=emplace%20back%E5%92%8Cpush%20back%E7%9A%84%E5%8C%BA%E5%88%AB&rsv_t=e209eW%2BJpJAfxPNT5LJuCJFtqIAXr6%2F2rtxIP9hCtUPrkRGfEUdfPGUpDotJ6Rocja0hWrc&sa=re_dqa_generate) 和 [push_back](https://www.baidu.com/s?wd=push_back&tn=15007414_23_dg&usm=1&ie=utf-8&rsv_pq=cacff78901165187&oq=emplace%20back%E5%92%8Cpush%20back%E7%9A%84%E5%8C%BA%E5%88%AB&rsv_t=c3c1FAdQNlWTffvOHVa0gEVkrHBb5L6ghZp8FNmBCjvDq8bLEMAwirirphFBjf5deLwaJCE&sa=re_dqa_generate) 的区别 12
> emplace_back 和 push_back 的主要区别在于它们的底层实现机制不同。 push_back 在向容器尾部添加元素时，首先会创建这个元素，然后再将这个元素拷贝或者移动到容器中；而 emplace_back 则是直接在容器尾部创建这个元素，省去了拷贝或移动元素的过程。
> **emplace_back 的优点**
>
> - 效率高：emplace_back 通过直接在容器尾部创建元素，避免了不必要的拷贝或移动操作，因此执行效率更高。
> - 支持原地构造：emplace_back 可以接受多个构造参数，直接在容器中构造元素，减少了构造和插入的步骤。
>   **push_back 的优点**
> - 代码可读性好：push_back 的语法更简单，对于已经创建好的对象，使用 push_back 会使代码更易于理解和维护。
> - 错误定位容易：push_back 在发生错误时更容易定位问题，因为它的操作步骤更直观。
>   **选择建议**
> - 对于已经创建好的对象，优先使用 push_back，因为它的代码可读性更好，错误也更容易定位。
> - 对于未创建的对象，优先使用 emplace_back，因为它直接在容器中构造元素，效率更高。

### 链表

#### 19. 删除链表的倒数第 N 个结点

[19. 删除链表的倒数第 N 个结点 - 力扣（LeetCode）](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/submissions/552146218/)

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode* dummyHead = new ListNode(0);
        dummyHead->next=head;
        ListNode* slow=dummyHead;
        ListNode* fast= dummyHead;
        while(n--&&fast!=NULL){
            fast=fast->next;
        }
        fast=fast->next;
        while(fast!=NULL){
            fast=fast->next;
            slow=slow->next;
        }
        slow->next=slow->next->next;
        return dummyHead->next;
    }
};
```

#### 24.两两交换链表中的节点

[24. 两两交换链表中的节点 - 力扣（LeetCode）](https://leetcode.cn/problems/swap-nodes-in-pairs/description/)

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        ListNode* dummyHead = new ListNode(0);
        dummyHead->next=head;
        ListNode* cur = dummyHead;
        while(cur->next !=nullptr && cur->next->next!=nullptr){
            ListNode * tmp=cur->next;
            ListNode* tmp1 = cur->next->next->next;
            cur->next=cur->next->next;
            cur->next->next=tmp;
            cur->next->next->next=tmp1;
            cur=cur->next->next;
        }
        ListNode* result=dummyHead->next;
        delete dummyHead;
        return result;
    }
};
```

#### 142.环形链表 II

[142. 环形链表 II - 力扣（LeetCode）](https://leetcode.cn/problems/linked-list-cycle-ii/description/)

快慢指针，计算相遇位置与入环位置

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode *detectCycle(ListNode *head) {
        ListNode* fast =head;
        ListNode* slow=head;
        while(fast!=NULL&&fast->next!=NULL){
            fast=fast->next->next;
            slow=slow->next;
            if(fast==slow){
                ListNode* index1=head;
                ListNode* index2=fast;
                while(index1!=index2){
                    index1=index1->next;
                    index2=index2->next;

                }
                return index1;
            }
        }
        return NULL;
    }
};
```

#### 203. 移除链表元素

[203. 移除链表元素 - 力扣（LeetCode）](https://leetcode.cn/problems/remove-linked-list-elements/description/)

直接使用原来的链表来进行移除节点操作：

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* removeElements(ListNode* head, int val) {
        while (head != NULL && head->val == val) {
            ListNode* tmp = head;
            head = head->next;
            delete tmp;
        }
        ListNode* cur = head;
        while (cur != NULL && cur->next != NULL) {
            if (cur->next->val == val) {
                ListNode* tmp = cur->next;
                cur->next = cur->next->next;
                delete tmp;
            } else {
                cur = cur->next;
            }
        }
        return head;
    }
};
```

- 时间复杂度: O(n)
- 空间复杂度: O(1)

设置一个虚拟头结点在进行移除节点操作：

```cpp
class Solution {
public:
    ListNode* removeElements(ListNode* head, int val) {
        ListNode* dummyHead = new ListNode(0);
        dummyHead->next = head;
        ListNode* cur = dummyHead;
        while (cur->next != NULL) {
            if (cur->next->val == val) {
                ListNode* tmp = cur->next;
                cur->next = cur->next->next;
                delete tmp;
            } else {
                cur = cur->next;
            }
        }
        head = dummyHead->next;
        delete dummyHead;
        return head;
    }
};
```

- 时间复杂度: O(n)
- 空间复杂度: O(1)

#### 206.反转链表

[206. 反转链表 - 力扣（LeetCode）](https://leetcode.cn/problems/reverse-linked-list/submissions/550836800/)

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* temp;
        ListNode* cur=head;
        ListNode* pre=NULL;
        while(cur){
            temp=cur->next;
            cur->next=pre;
            pre=cur;
            cur=temp;
        }
        return pre;
    }
};
```

#### 242.有效的字母异位词

[242. 有效的字母异位词 - 力扣（LeetCode）](https://leetcode.cn/problems/valid-anagram/submissions/551748151/)

```cpp
class Solution {
public:
    bool isAnagram(string s, string t) {
        int record[26]={0};
        for(int i = 0;i<s.size();++i){
            record[s[i]-'a']++;
        }
        for(int i =0;i<t.size();++i){
            record[t[i]-'a']--;
        }
        for(int i =0;i<26;++i){
            if(record[i]!=0){
                return false;
            }
        }
        return true;
    }
};
```

#### 707.设计链表

[707. 设计链表 - 力扣（LeetCode）](https://leetcode.cn/problems/design-linked-list/submissions/550507623/)

> 链表基本操作

```cpp
class MyLinkedList {
public:
    struct LinkedNode {
        int val;
        LinkedNode* next;
        LinkedNode(int val) : val(val), next(nullptr) {}
    };
    MyLinkedList() {
        _dummyHead = new LinkedNode(0);
        _size = 0;
    }

    int get(int index) {
        if (index > (_size - 1) || index < 0) {
            return -1;
        }
        LinkedNode* cur = _dummyHead->next;
        while (index--) {
            cur = cur->next;
        }
        return cur->val;
    }

    void addAtHead(int val) {
        LinkedNode* newNode = new LinkedNode(val);
        newNode->next = _dummyHead->next;
        _dummyHead->next = newNode;
        _size++;
    }

    void addAtTail(int val) {
        LinkedNode* newNode = new LinkedNode(val);
        LinkedNode* cur = _dummyHead;
        while (cur->next != nullptr) {
            cur = cur->next;
        }
        cur->next = newNode;
        _size++;
    }

    void addAtIndex(int index, int val) {
        if (index > _size)
            return;
        if (index < 0)
            index = 0;
        LinkedNode* newNode = new LinkedNode(val);
        LinkedNode* cur = _dummyHead;
        while (index--) {
            cur = cur->next;
        }
        newNode->next=cur->next;
        cur->next=newNode;
        _size++;
    }

    void deleteAtIndex(int index) {
        if (index >= _size || index < 0) {
            return;
        }
        LinkedNode* cur = _dummyHead;
        while (index--) {
            cur = cur->next;
        }
        LinkedNode* tmp = cur->next;
        cur->next = cur->next->next;
        delete tmp;
        tmp = nullptr;
        _size--;
    }

private:
    int _size;
    LinkedNode* _dummyHead;
};

/**
 * Your MyLinkedList object will be instantiated and called as such:
 * MyLinkedList* obj = new MyLinkedList();
 * int param_1 = obj->get(index);
 * obj->addAtHead(val);
 * obj->addAtTail(val);
 * obj->addAtIndex(index,val);
 * obj->deleteAtIndex(index);
 */
```

#### 面试题 02.07. 链表相交

[面试题 02.07. 链表相交 - 力扣（LeetCode）](https://leetcode.cn/problems/intersection-of-two-linked-lists-lcci/description/)

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {
        ListNode* curA = headA;
        ListNode* curB = headB;
        int lenA = 0, lenB = 0;
        while (curA != NULL) { // 求链表A的长度
            lenA++;
            curA = curA->next;
        }
        while (curB != NULL) { // 求链表B的长度
            lenB++;
            curB = curB->next;
        }
        curA = headA;
        curB = headB;
        // 让curA为最长链表的头，lenA为其长度
        if (lenB > lenA) {
            swap (lenA, lenB);
            swap (curA, curB);
        }
        // 求长度差
        int gap = lenA - lenB;
        // 让curA和curB在同一起点上（末尾位置对齐）
        while (gap--) {
            curA = curA->next;
        }
        // 遍历curA 和 curB，遇到相同则直接返回
        while (curA != NULL) {
            if (curA == curB) {
                return curA;
            }
            curA = curA->next;
            curB = curB->next;
        }
        return NULL;
    }
};
```

### 哈希表

#### 202.快乐数

[202. 快乐数 - 力扣（LeetCode）](https://leetcode.cn/problems/happy-number/submissions/553986616/)

```cpp
class Solution {
public:
    int getsum(int  n ){
        int sum = 0 ;
        while(n){
            sum+=(n%10)*(n%10);
            n/=10;
        }
        return sum;
    }
    bool isHappy(int n) {
        unordered_set<int >sett;
        while(true){
            int sum=getsum(n);
            if(sum == 1 ){
                return true;
            }
            if(sett.find(sum)!=sett.end()){
                return false;
            }else{
                sett.insert (sum);
            }
        n=sum;
        }
    }
};
```

> 使用 set，注意**无限循环**

#### 205. 同构字符串

[205. 同构字符串 - 力扣（LeetCode）](https://leetcode.cn/problems/isomorphic-strings/description/?envType=study-plan-v2&envId=top-interview-150)

```cpp
class Solution {
public:
    bool isIsomorphic(string s, string t) {
        unordered_map<char,char>t2s,s2t;
        for(int i =0;i<s.size();++i){
            char a=s[i],b=t[i];
            if((s2t.find(a)!=s2t.end()&&s2t[a]!=b)||
            (t2s.find(b)!=t2s.end()&&t2s[b]!=a)){
                return false;
            }
            s2t[a]=b;
            t2s[b]=a;
        }
        return true;
    }
};
```

> 建立映射

#### 242. 有效的字母异位词

[242. 有效的字母异位词 - 力扣（LeetCode）](https://leetcode.cn/problems/valid-anagram/description/)

```cpp
class Solution {
public:
    bool isAnagram(string s, string t) {
        int record[26]={0};
        for(int i =0;i<s.size();++i){
            record[s[i]-'a']++;
        }
        for(int i=0;i<t.size();++i){
            record[t[i]-'a']--;
        }
        for(int i=0;i<26;++i){
            if(record[i]!=0){
                return false;
            }
        }
        return true;
    }
};
```

#### 349.两个数组的交集

[349. 两个数组的交集 - 力扣（LeetCode）](https://leetcode.cn/problems/intersection-of-two-arrays/submissions/552023443/)

> 用的 unordered_set

```cpp
class Solution {
public:
    vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {
        unordered_set<int>result;
        unordered_set<int>nums_set(nums1.begin(),nums1.end());
        for(int num:nums2){
            if(nums_set.find(num)!=nums_set.end()){
                result.insert(num);
            }
        }
        return vector<int>(result.begin(),result.end());
    }
};
```

自己

```java
class Solution {
public:
    vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {
        vector<int> ans(1005);
        vector<int> tmp;
        for(int i =0;i<nums1.size();++i){
            ans[nums1[i]]++;
        }
        for(int i=0;i<nums2.size();++i){
            if(ans[nums2[i]]){
                tmp.push_back(nums2[i]);
                ans[nums2[i]]=0;
            }
        }
        return tmp;
    }
};
```

#### 3146.两个字符串的排列差

[3146. 两个字符串的排列差 - 力扣（LeetCode）](https://leetcode.cn/problems/permutation-difference-between-two-strings/submissions/558268853/)

> 哈希表思路

```cpp
class Solution {
public:
    int findPermutationDifference(string s, string t) {
        unordered_map<char,int>char2index;
        for(int i =0;i<s.length();++i){
            char2index[s[i]]=i;
        }
        int sum=0;
        for(int i=0;i<t.length();++i){
            sum+=abs(i-char2index[t[i]]);
        }
        return sum;
    }
};
```

#### 

### 字符串

#### 14.最长公共前缀

[14. 最长公共前缀 - 力扣（LeetCode）](https://leetcode.cn/problems/longest-common-prefix/description/?envType=study-plan-v2&envId=top-interview-150)

自写，无算法：

```cpp
class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        string ans;
        if(strs.size()==1)return strs[0];
        for(int i =0;i<strs[0].size();++i){
            for(int j=0;j<strs.size()-1;++j){
                if(strs[j][i]==strs[j+1][i]){
                    if(j+1==strs.size()-1){
                        ans+=(strs[j][i]);
                    }
                    continue;
                }else{
                    return ans;
                }
                
            }
        }
        return ans;
    }
};
```

#### 344.反转字符串

[344. 反转字符串 - 力扣（LeetCode）](https://leetcode.cn/problems/reverse-string/submissions/555463827/)

```cpp
class Solution {
public:
    void reverseString(vector<char>& s) {
        for(int i =0,j=s.size()-1;i<s.size()/2;++i,--j){
            swap(s[i],s[j]);
        }
    }
};
```

### 栈和队列

#### 20.有效的括号

[20. 有效的括号](https://leetcode.cn/problems/valid-parentheses/)

```cpp
class Solution {
public:
    bool isValid(string s) {
        if(s.size()%2!=0)return false;
        stack<int> st;
        for(int i =0;i<s.size();++i){
            if(s[i]=='(')st.push(')');
            else if (s[i] == '{') st.push('}');
            else if (s[i] == '[') st.push(']');
            else if (st.empty() || st.top() != s[i]) return false;
            else st.pop(); 
        }
        return st.empty();
        }

};
```

#### 150.逆波兰表达式求值

[150. 逆波兰表达式求值 - 力扣（LeetCode）](https://leetcode.cn/problems/evaluate-reverse-polish-notation/submissions/554776322/)

```cpp
class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<int>st;
        for(int i =0;i<tokens.size();++i){
            if(tokens[i]=="+"||tokens[i]=="-"||tokens[i]=="*"||tokens[i]=="/"){
                int num1=st.top();
                st.pop();
                int num2=st.top();
                st.pop();
                if(tokens[i]=="+"){
                    st.push(num1+num2);
                }else if(tokens[i]=="-"){
                    st.push(num2-num1);
                }else if(tokens[i]=="*"){
                    st.push(num2*num1);
                }else if(tokens[i]=="/"){
                    st.push(num2/num1);
                }
            }else{
                    st.push(stoi(tokens[i]));
                }
        }
        int result=st.top();
        return result;
    }
};
```

#### 225.用队列实现栈

[225. 用队列实现栈 - 力扣（LeetCode）](https://leetcode.cn/problems/implement-stack-using-queues/description/)

单队列版本：

```cpp
class MyStack {
public:
    queue<int>que;
    MyStack() {

    }
    
    void push(int x) {
        que.push(x);
    }
    
    int pop() {
        int size=que.size();
        size-=1;
        while(size--){
            que.push(que.front());
            que.pop();
        }
        int result=que.front();
        que.pop();
        return result;
    }
    
    int top() {
        int size=que.size();
        size-=1;
        while(size--){
            que.push(que.front());
            que.pop();
        }
        int result=que.front();
        que.push(result);
        que.pop();
        return result;
    }
    
    bool empty() {
        return que.empty();
    }
};

/**
 * Your MyStack object will be instantiated and called as such:
 * MyStack* obj = new MyStack();
 * obj->push(x);
 * int param_2 = obj->pop();
 * int param_3 = obj->top();
 * bool param_4 = obj->empty();
 */
```

#### 232.用栈实现队列

[232. 用栈实现队列 - 力扣（LeetCode）](https://leetcode.cn/problems/implement-queue-using-stacks/description/)

```cpp
class MyQueue {
public:
    stack<int>stin;
    stack<int>stout;
    MyQueue() {

    }
    
    void push(int x) {
        stin.push(x);
    }
    
    int pop() {
        if(stout.empty()){
            while(!stin.empty()){
                stout.push(stin.top());
                stin.pop();
            }
        }
        int ans=stout.top();
        stout.pop();
        return ans;
    }
    
    int peek() {
        int res=this->pop();
        stout.push(res);
        return res;
    }
    
    bool empty() {
        return stin.empty()&&stout.empty();
    }
};

/**
 * Your MyQueue object will be instantiated and called as such:
 * MyQueue* obj = new MyQueue();
 * obj->push(x);
 * int param_2 = obj->pop();
 * int param_3 = obj->peek();
 * bool param_4 = obj->empty();
 */
```

> 用两个栈实现队列，注意代码复用

#### [239. 滑动窗口最大值](https://leetcode.cn/problems/sliding-window-maximum/submissions/555112309/)

[239. 滑动窗口最大值 - 力扣（LeetCode）](https://leetcode.cn/problems/sliding-window-maximum/submissions/555112309/)

```cpp
class Solution {
private:
    class MYQue{
    public:
        deque<int>que;
    void pop(int value){
        if(!que.empty()&&value==que.front()){
            que.pop_front();
        }
    }
    void push(int value){
        while(!que.empty()&&value>que.back()){
            que.pop_back();
        }
        que.push_back(value);
    }
    int front(){
        return que.front();
    }
    };
    
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        MYQue que;
        vector<int> result;
        for(int i =0;i<k;++i){
            que.push(nums[i]);
        }
        result.push_back(que.front());
        for(int i =k;i<nums.size();++i){
            que.pop(nums[i-k]);
            que.push(nums[i]);
            result.push_back(que.front());
        }
        return result;
    }
};
```

> 单调队列，三个步骤，1.pop 头 2.push 弹出比该数小的 3.记录最大值

#### 1047.删除字符串中的所有相邻重复项

[1047. 删除字符串中的所有相邻重复项 - 力扣（LeetCode）](https://leetcode.cn/problems/remove-all-adjacent-duplicates-in-string/submissions/554770625/)

```cpp
class Solution {
public:
    string removeDuplicates(string s) {
        stack<char> st;
        for(char ss:s){
            if(st.empty()||ss!=st.top()){
                st.push(ss);
            }else{
                st.pop();
            }
        }
        string result;
        result="";
        while(!st.empty()){
            result+=st.top();
            st.pop();
        }
        reverse(result.begin(),result.end());
        return result;
    }
};
```

### 二叉树

#### 100.相同的树

[100. 相同的树 - 力扣（LeetCode）](https://leetcode.cn/problems/same-tree/submissions/581246006/?envType=study-plan-v2&envId=2024-spring-sprint-100)

```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    bool isSameTree(TreeNode* p, TreeNode* q) {
        if(p==nullptr&&q==nullptr){
            return true;
        }else if(p==nullptr||q==nullptr){
            return false;
        } else if (p->val != q->val) {
            return false;
        }
        else{
            return isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
        }
    }
};
```

#### 101.对称二叉树

[101. 对称二叉树 - 力扣（LeetCode）](https://leetcode.cn/problems/symmetric-tree/submissions/560544424/)

```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    bool compare(TreeNode* left,TreeNode* right){
        if (left == NULL && right != NULL) return false;
        else if (left != NULL && right == NULL) return false;
        else if (left == NULL && right == NULL) return true;
        else if (left->val != right->val) return false;
        bool outside = compare(left->left, right->right);    
        bool inside = compare(left->right, right->left);    
        bool isSame = outside && inside;                    
        return isSame;
    }
    bool isSymmetric(TreeNode* root) {
        if (root == NULL) return true;
        return compare(root->left, root->right);
    }
};
```

#### 102. 二叉树的层序遍历

[102. 二叉树的层序遍历 - 力扣（LeetCode）](https://leetcode.cn/problems/binary-tree-level-order-traversal/submissions/556335470/)

```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        queue<TreeNode*>que;
        if(root!=NULL)que.push(root);
        vector<vector<int>> result;
        while (!que.empty()) {
            int size = que.size();
            vector<int> vec;
            for (int i = 0; i < size; i++) {
                TreeNode* node = que.front();
                que.pop();
                vec.push_back(node->val);
                if (node->left) que.push(node->left);
                if (node->right) que.push(node->right);
            }
            result.push_back(vec);
        }
        return result;
    }
};
```

#### 107.二叉树的层序遍历 II

[107. 二叉树的层序遍历 II - 力扣（LeetCode）](https://leetcode.cn/problems/binary-tree-level-order-traversal-ii/description/)

自：层次遍历 +ans 翻转

```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    vector<vector<int>> levelOrderBottom(TreeNode* root) {
        queue<TreeNode*> que;
        vector<vector<int > >ans;
        vector<int> vec;
        TreeNode* node;
        if(root!=NULL)que.push(root);
        int size;
        
        while(!que.empty()){
            size=que.size();
            vec.clear();
            
            for(int i =0;i<size;++i){
                node=que.front();
                que.pop();
                vec.push_back(node->val);
                if(node->left)que.push(node->left);
                if(node->right)que.push(node->right);
                
            }  
            ans.push_back(vec);
        }
        reverse(ans.begin(),ans.end());
        return ans;
    }
};
```

#### 108. 将有序数组转换为二叉搜索树

[108. 将有序数组转换为二叉搜索树 - 力扣（LeetCode）](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/description/?envType=study-plan-v2&envId=top-100-liked)

```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
    // 把 nums[left] 到 nums[right-1] 转成平衡二叉搜索树
    TreeNode* dfs(vector<int>& nums, int left, int right) {
        if (left == right) {
            return nullptr;
        }
        int m = left + (right - left) / 2;
        return new TreeNode(nums[m], dfs(nums, left, m), dfs(nums, m + 1, right));
    }
public:
    TreeNode* sortedArrayToBST(vector<int>& nums) {
        return dfs(nums, 0, nums.size());
    }
};
```

#### 226.翻转二叉树

[226. 翻转二叉树 - 力扣（LeetCode）](https://leetcode.cn/problems/invert-binary-tree/submissions/559135150/)

```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if(root==NULL)return root;
        swap(root->left,root->right);
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};
```

#### 543. 二叉树的直径

[543. 二叉树的直径 - 力扣（LeetCode）](https://leetcode.cn/problems/diameter-of-binary-tree/description/?envType=study-plan-v2&envId=top-100-liked)

```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */

class Solution {
public:
    int diameterOfBinaryTree(TreeNode* root) {
        int ans = 0;
        dfs(root, ans);
        return ans;
    }
    
private:
    // 辅助函数，用于深度优先搜索并计算直径
    int dfs(TreeNode* node, int& ans) {
        if (node == nullptr) {
            return -1; // 返回 -1 是为了在计算链长时加1得到实际长度
        }
        
        // 递归计算左子树的最大链长
        int l_len = dfs(node->left, ans) + 1;
        // 递归计算右子树的最大链长
        int r_len = dfs(node->right, ans) + 1;
        
        // 更新直径，取当前节点左右子树链长之和与已有直径的较大值
        ans = max(ans, l_len + r_len);
        
        // 返回当前子树的最大链长
        return max(l_len, r_len);
    }
};
```

#### 1367. 二叉树中的链表

[1367. 二叉树中的链表 - 力扣（LeetCode）](https://leetcode.cn/problems/linked-list-in-binary-tree/solutions/3034003/dan-di-gui-xie-fa-pythonjavacgo-by-endle-00js/)

在二叉树中找到某串链表

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    bool isSubPath(ListNode* head, TreeNode* root) {
        auto dfs = [&](this auto&& dfs, ListNode* s, TreeNode* t) -> bool {
            if (s == nullptr) { // 整个链表匹配完毕
                return true;
            }
            // 否则需要继续匹配
            if (t == nullptr) { // 无法继续匹配
                return false;
            }
            // 节点值相同则继续匹配，否则从 head 开始重新匹配
            return s->val == t->val && (dfs(s->next, t->left) || dfs(s->next, t->right)) ||
                   s == head && (dfs(head, t->left) || dfs(head, t->right));
        };
        return dfs(head, root);
    }
};
```

### 回溯

#### 39.组合总和

[39. 组合总和 - 力扣（LeetCode）](https://leetcode.cn/problems/combination-sum/description/)

```cpp
class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        vector<int> state;              // 状态（子集）
        sort(candidates.begin(), candidates.end()); // 对 candidates 进行排序
        int start = 0;                  // 遍历起始点
        vector<vector<int>> res;        // 结果列表（子集列表）
        backtrack(state, target, candidates, start, res);
        return res;
    }
private:
    void backtrack(vector<int> &state, int target, vector<int> &choices, int start, vector<vector<int>> &res) {
        // 子集和等于 target 时，记录解
        if (target == 0) {
            res.push_back(state);
            return;
        }
        // 遍历所有选择
        // 剪枝二：从 start 开始遍历，避免生成重复子集
        for (int i = start; i < choices.size(); i++) {
            // 剪枝一：若子集和超过 target ，则直接结束循环
            // 这是因为数组已排序，后边元素更大，子集和一定超过 target
            if (target - choices[i] < 0) {
                break;
            }
            // 尝试：做出选择，更新 target, start
            state.push_back(choices[i]);
            // 进行下一轮选择
            backtrack(state, target - choices[i], choices, i, res);
            // 回退：撤销选择，恢复到之前的状态
            state.pop_back();
        }
    }
};
```

40.组合总和 II

[40. 组合总和 II - 力扣（LeetCode）](https://leetcode.cn/problems/combination-sum-ii/description/)

```cpp
class Solution {
public:
    vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
        vector<int> state;              // 状态（子集）
        sort(candidates.begin(), candidates.end()); // 对 candidates 进行排序
        int start = 0;                  // 遍历起始点
        vector<vector<int>> res;        // 结果列表（子集列表）
        backtrack(state, target, candidates, start, res);
        return res;
    }
private:
    void backtrack(vector<int> &state, int target, vector<int> &choices, int start, vector<vector<int>> &res) {
        // 子集和等于 target 时，记录解
        if (target == 0) {
            res.push_back(state);
            return;
        }
        // 遍历所有选择
        // 剪枝二：从 start 开始遍历，避免生成重复子集
        for (int i = start; i < choices.size(); i++) {
            // 剪枝一：若子集和超过 target ，则直接结束循环
            // 这是因为数组已排序，后边元素更大，子集和一定超过 target
            if (target - choices[i] < 0) {
                break;
            }
            if (i > start && choices[i] == choices[i - 1]) {
                continue;
            }
            // 尝试：做出选择，更新 target, start
            state.push_back(choices[i]);
            // 进行下一轮选择
            backtrack(state, target - choices[i], choices, i+1, res);
            // 回退：撤销选择，恢复到之前的状态
            state.pop_back();
        }
    }
};
```

### 贪心

#### 445.分发饼干

```cpp
class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        if(s.empty())return 0;
        sort(g.begin(),g.end());
        sort(s.begin(),s.end());
        int index=s.size()-1;
        int cnt=0;
        
        for(int i =g.size()-1;i>=0;--i){
            if(index>=0&&g[i]<=s[index]){
                index--;
                cnt++;
            }
        }
        return cnt;
    }
};
```

> 注意 if 里的两个条件的判断顺序不能颠倒

### 动态规划

#### 45.跳跃游戏 II

[45. 跳跃游戏 II - 力扣（LeetCode）](https://leetcode.cn/problems/jump-game-ii/description/)

```cpp
class Solution {
public:
    int jump(vector<int>& nums) {
        vector<int> dp(nums.size());
        for(int i =0;i<nums.size();++i){
            dp[i]=i;
        }
        for(int i =1;i<nums.size();++i){
            for(int j=0;j<i;++j){
                if(j+nums[j]>=i){
                    dp[i]=min(dp[i],dp[j]+1);
                }
            }
        }
        return dp[nums.size()-1];
    }
};//自己写
```

#### 53.最大子数组和

[53. 最大子数组和](https://leetcode.cn/problems/maximum-subarray/)

```cpp
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        if (nums.size() == 0) return 0;
        vector<int> dp(nums.size());
        dp[0] = nums[0];
        int result = dp[0];
        for (int i = 1; i < nums.size(); i++) {
            dp[i] = max(dp[i - 1] + nums[i], nums[i]); // 状态转移公式
            if (dp[i] > result) result = dp[i]; // result 保存dp[i]的最大值
        }
        return result;
    }
};
```

#### 62.不同路径

[62. 不同路径 - 力扣（LeetCode）](https://leetcode.cn/problems/unique-paths/description/)

```cpp
class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<vector<int>> dp(m, vector<int>(n, 0));
        for (int i = 0; i < m; i++) dp[i][0] = 1;
        for (int j = 0; j < n; j++) dp[0][j] = 1;
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
            }
        }
        return dp[m - 1][n - 1];
    }
};
```

#### 70.爬楼梯

```cpp
class Solution {
public:
    int climbStairs(int n) {
        int a=1;
        int b= 1;
        int tmp;
        for(int i =0;i<n-1;++i){
            tmp=a+b;
            a=b;
            b=tmp;

        }
        return b;
        
    }
};
```

#### 198.打家劫舍

[198. 打家劫舍 - 力扣（LeetCode）](https://leetcode.cn/problems/house-robber/description/)

```cpp
class Solution {
public:
    int rob(vector<int>& nums) {
        if (nums.size() == 0) return 0;
        if (nums.size() == 1) return nums[0];
        vector<int> dp(nums.size());//注意这里初始化空间不然下面没发访问
        dp[0]=nums[0];
        dp[1]=max(nums[0], nums[1]);
        for(int i =2;i<nums.size();++i){
            dp[i]=max(dp[i-2]+nums[i],dp[i-1]);
        }
        return dp[nums.size()-1];
    }
};
```

#### 300. 最长递增子序列

[300. 最长递增子序列 - 力扣（LeetCode）](https://leetcode.cn/problems/longest-increasing-subsequence/description/)

```cpp
class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        if (nums.size() <= 1) return nums.size();
        vector<int> dp(nums.size(), 1);
        int result = 0;
        for (int i = 1; i < nums.size(); i++) {
            for (int j = 0; j < i; j++) {
                if (nums[i] > nums[j]) dp[i] = max(dp[i], dp[j] + 1);
            }
            if (dp[i] > result) result = dp[i]; // 取长的子序列
        }
        return result;
    }
};
```

#### lg p1048 经典背包

[P1048 [NOIP2005 普及组] 采药 - 洛谷 | 计算机科学教育新生态](https://www.luogu.com.cn/problem/P1048)

```cpp
#include "iostream"
#include "stdio.h"
#include<bits/stdc++.h>
using namespace std;
int w[105],val[105];
int dp[105][1005];
int main()
{
    int t,m,res=-1;
    scanf("%d%d",&t,&m);
    for(int i=1;i<=m;i++)
    {
        scanf("%d%d",&w[i],&val[i]);
    }
    
    for(int i=1;i<=m;i++) 
        for(int j=t;j>=0;j--)  
        {
            if(j>=w[i])
            {
                dp[i][j]=max(dp[i-1][j-w[i]]+val[i],dp[i-1][j]);
            }  
            else
            {
                dp[i][j]=dp[i-1][j];
            }              
        }
    printf("%d",dp[m][t]);
    return 0;
}
```

#### Lg p1115 最大子段和

[P1115 最大子段和 - 洛谷 | 计算机科学教育新生态](https://www.luogu.com.cn/problem/P1115)

```cpp
#include<bits/stdc++.h>
using namespace std;
int n,a[200020],b[200020],i,ans=-2147483647;

// b[i] 表示截止到 i 时，第 i 个数所在的有效序列的元素和。

int main(){
   cin>>n;
   for(i=1;i<=n;i++){
       cin>>a[i];
       if(i==1) b[i]=a[i];
       else b[i]=max(a[i],b[i-1]+a[i]);
       ans=max(ans,b[i]);
   }
   cout<<ans;
   return 0;
}
```

### 动态规划-记忆化搜索

#### P1434 [SHOI2002] 滑雪

[https://www.luogu.com.cn/problem/P1434](https://www.luogu.com.cn/problem/P1434)

```cpp
#include<bits/stdc++.h> 
using namespace std;
int dx[4]={0,0,1,-1};
int dy[4]={1,-1,0,0};
int n,m,a[201][201],s[201][201],ans;
bool use[201][201];//这个就是所谓的不需要
int dfs(int x,int y){
        if(s[x][y])return s[x][y];
        s[x][y]=1;
        for(int i =0;i<4;++i){
                int xx=dx[i]+x;
                int yy=dy[i]+y;
                if(xx>0&&yy>0&&xx<=n&&yy<=m&&a[x][y]>a[xx][yy]){
                 dfs(xx,yy);
          s[x][y]=max(s[x][y],s[xx][yy]+1);
       }
        }
        return s[x][y];
}

int main()
{        
   cin>>n>>m;//同题目的R,C
   for(int i=1;i<=n;i++)
     for(int j=1;j<=m;j++)
       cin>>a[i][j];
    for(int i=1;i<=n;i++)//找从每个出发的最长距离
      for(int j=1;j<=m;j++)
        ans=max(ans,dfs(i,j));//取最大值
    cout<<ans;
    return 0;
}
```

### 递归

#### 50. Pow(x, n)

[50. Pow(x, n) - 力扣（LeetCode）](https://leetcode.cn/problems/powx-n/description/?envType=study-plan-v2&envId=2024-spring-sprint-100)

```cpp
class Solution {
public:
    double myPow(double x, int N) {
        double ans = 1;
        long long n = N;
        if (n < 0) { // x^-n = (1/x)^n
            n = -n;
            x = 1 / x;
        }
        while (n) { // 从低到高枚举 n 的每个比特位
            if (n & 1) { // 这个比特位是 1
                ans *= x; // 把 x 乘到 ans 中
            }
            x *= x; // x 自身平方
            n >>= 1; // 继续枚举下一个比特位
        }
        return ans;
    }
};
```

> 快速幂

### 位运算

#### 2595. 奇偶位数

[2595. 奇偶位数 - 力扣（LeetCode）](https://leetcode.cn/problems/number-of-even-and-odd-bits/description/)

版本一

```cpp
class Solution {
public:
    vector<int> evenOddBit(int n) {
        vector<int> ans(2);
        for (int i = 0; n; n >>= 1) {
            ans[i] += n & 1;
            i ^= 1; // 切换奇偶
        }
        return ans;
    }
};

作者：灵茶山艾府
链接：https://leetcode.cn/problems/number-of-even-and-odd-bits/solutions/2177848/er-jin-zhi-ji-ben-cao-zuo-pythonjavacgo-o82o2/
来源：力扣（LeetCode）
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
```

版本二

```cpp
class Solution {
public:
    vector<int> evenOddBit(int n) {
        const unsigned MASK = 0x55555555u;
        return {popcount(n & MASK), popcount(n & ~MASK)};
    }
};

作者：灵茶山艾府
链接：https://leetcode.cn/problems/number-of-even-and-odd-bits/solutions/2177848/er-jin-zhi-ji-ben-cao-zuo-pythonjavacgo-o82o2/
来源：力扣（LeetCode）
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
```

### 设计题

#### 2502. 设计内存分配器

[2502. 设计内存分配器 - 力扣（LeetCode）](https://leetcode.cn/problems/design-memory-allocator/description/)

```java
class Allocator {
    vector<int> memory;

public:
    Allocator(int n) : memory(n) {}

    int allocate(int size, int mID) {
        int free = 0;
        for (int i = 0; i < memory.size(); i++) {
            if (memory[i] > 0) { // 已分配
                free = 0; // 重新计数
                continue;
            }
            free++;
            if (free == size) { // 找到了
                // fill(memory.begin() + (i - size + 1), memory.begin() + (i + 1), mID);        
                for(int j=i-size+1;j<=i;++j){
                    memory[j]=mID;
                }
                return i - size + 1;
            }
        }
        return -1; // 无法分配内存
    }

    int freeMemory(int mID) {
        int ans = 0;
        for (int i = 0; i < memory.size(); i++) {
            if (memory[i] == mID) {
                ans++;
                memory[i] = 0; // 标记为空闲内存
            }
        }
        return ans;
    }
};
```

### 其他

#### 生日悖论

生日悖论是指在不少于 23 个人中至少有两人生日相同的概率大于 50%。例如在一个 30 人的小学班级中，存在两人生日相同的概率为 70%。对于 60 人的大班，这种概率要大于 99%。从引起逻辑矛盾的角度来说，生日悖论是一种 “佯谬”。但这个数学事实十分反直觉，故称之为一个悖论。——百度百科

小码哥对这个问题很感兴趣，他决定统计一下自己班上有没有同一天生日的同学，你能帮帮他吗？

格式

```cpp
输入格式：
第一行输入一个整数n_n_，表示学生数量；
接下来n_n_行，每行包含一个字符串和两个整数，分别表示学生的姓名和出生月、出生日。用一个空格分隔。
输出格式：
每组同一天生日的学生输出一行。每行前两个整数表示出生月、日，后面按姓名字典序从小到大输出所有当天出生的学生的名字，用一个空格分隔。对所有的输出，要求按日期从小到大输出。
如果全部的学生生日都不相同，输出一行一个字符串“None”（不含引号）。
```

```cpp
#include<bits/stdc++.h> 
using namespace std;


struct Student{
        string name;
        int month;
        int day;
};


bool compareStudent(const Student&a,const Student& b){
        if(a.month!=b.month)return a.month<b.month;
        if(a.day!=b.day)return a.day<b.day;
        return a.name<b.name;
}
int main() {
        int n;
    cin >> n;
    vector<Student> students(n);

    for (int i = 0; i < n; ++i) {
        cin >> students[i].name >> students[i].month >> students[i].day;
    }
    sort(students.begin(), students.end(), compareStudents);
        
    map<pair<int, int>, vector<string>> birthdayMap;

    for (const auto& student : students) {
        birthdayMap[{student.month, student.day}].push_back(student.name);
    }

    bool foundSameBirthday = false;
    for (const auto& entry : birthdayMap) {
        if (entry.second.size() > 1) {
            foundSameBirthday = true;
            cout << entry.first.first << " " << entry.first.second << " ";
            for (const auto& name : entry.second) {
                cout << name << " ";
            }
            cout << endl;
        }
    }

    if (!foundSameBirthday) {
        cout << "None" << endl;
    }

    return 0;
}
```

### note

#### [&](int i) -> int

auto bfs = [&](int i) -> int

- **auto bfs**：声明一个名为 `bfs` 的变量，类型由编译器自动推断。
- **[&]**：表示捕获外部作用域中的所有变量（按引用）。这意味着在 `bfs` 函数体内，你可以直接使用外部变量，而不需要传递它们作为参数。
- **(int i)**：定义了一个参数 `i`，类型为 `int`。这意味着 `bfs` 函数可以接受一个整数参数。
- **-> int**：指定返回值类型为 `int`。这意味着 `bfs` 函数将返回一个整数值。

```cpp
#include <iostream>
#include <vector>
#include <queue>

int main() {
    std::vector<int> data = {1, 2, 3, 4, 5};
    int sum = 0;

    // 定义 BFS 函数
    auto bfs = [&](int i) -> int {
        sum += data[i]; // 使用外部变量 sum
        return sum; // 返回当前的 sum
    };

    // 调用 BFS 函数
    for (int i = 0; i < data.size(); ++i) {
        std::cout << "Current sum after adding data[" << i << "] = " << bfs(i) << std::endl;
    }

    return 0;
}
```

#### 二进制

[3280. 将日期转换为二进制表示 - 力扣（LeetCode）](https://leetcode.cn/problems/convert-date-to-binary/description/)

```cpp
class Solution {
public:
    string convertDateToBinary(string date) {
        return format("{:b}-{:b}-{:b}",
                      stoi(date.substr(0, 4)),
                      stoi(date.substr(5, 2)),
                      stoi(date.substr(8, 2)));
    }
};
```

#### iota

void iota(ForwardIterator it, ForwardIterator end, T value);

```cpp
#include <iostream>
#include <vector>
#include <algorithm> // 包含 iota 的头文件

int main() {
    std::vector<int> vec(10); // 创建一个大小为 10 的向量
    std::iota(vec.begin(), vec.end(), 0); // 从 0 开始填充

    // 输出结果
    for (int num : vec) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

输出

```cpp
0 1 2 3 4 5 6 7 8 9
```

#### stl:upper_bound

(ranges::upper_bound(arr, x) - ranges::lower_bound(arr, x)
