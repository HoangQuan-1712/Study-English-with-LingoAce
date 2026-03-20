// src/lib/mockData.ts
// Sau này thay bằng fetch API — chỉ cần đổi ở file này

export type Card = {
    id: number
    term: string
    definition: string
    pronunciation?: string
}

export type StudySet = {
    id: number
    title: string
    description: string
    author: string
    color: string
    cards: Card[]
}

export const MOCK_SETS: StudySet[] = [
    {
        id: 1,
        title: 'Tiếng Anh Chuyên Ngành IT',
        description: 'Các thuật ngữ IT thông dụng trong công việc hàng ngày',
        author: 'Bạn',
        color: '#4255ff',
        cards: [
            { id: 1, term: 'algorithm', pronunciation: '/ˈælɡərɪðəm/', definition: 'thuật toán' },
            { id: 2, term: 'variable', pronunciation: '/ˈveəriəbl/', definition: 'biến số' },
            { id: 3, term: 'function', pronunciation: '/ˈfʌŋkʃən/', definition: 'hàm, chức năng' },
            { id: 4, term: 'compiler', pronunciation: '/kəmˈpaɪlər/', definition: 'trình biên dịch' },
            { id: 5, term: 'database', pronunciation: '/ˈdeɪtəbeɪs/', definition: 'cơ sở dữ liệu' },
            { id: 6, term: 'framework', pronunciation: '/ˈfreɪmwɜːrk/', definition: 'khung làm việc' },
            { id: 7, term: 'deployment', pronunciation: '/dɪˈplɔɪmənt/', definition: 'triển khai' },
            { id: 8, term: 'repository', pronunciation: '/rɪˈpɒzɪtri/', definition: 'kho lưu trữ code' },
            { id: 9, term: 'debugging', pronunciation: '/diːˈbʌɡɪŋ/', definition: 'gỡ lỗi' },
            { id: 10, term: 'refactoring', pronunciation: '/riːˈfæktərɪŋ/', definition: 'tái cấu trúc code' },
        ],
    },
    {
        id: 2,
        title: 'Từ Vựng IELTS Band 7.0',
        description: 'Từ vựng học thuật cho IELTS Writing & Reading',
        author: 'Bạn',
        color: '#ff4b4b',
        cards: [
            { id: 1, term: 'accommodate', pronunciation: '/əˈkɒmədeɪt/', definition: 'cung cấp chỗ ở, đáp ứng' },
            { id: 2, term: 'ambiguous', pronunciation: '/æmˈbɪɡjuəs/', definition: 'mơ hồ, không rõ ràng' },
            { id: 3, term: 'coherent', pronunciation: '/kəʊˈhɪərənt/', definition: 'mạch lạc, nhất quán' },
            { id: 4, term: 'diminish', pronunciation: '/dɪˈmɪnɪʃ/', definition: 'giảm bớt, thu nhỏ' },
            { id: 5, term: 'explicit', pronunciation: '/ɪkˈsplɪsɪt/', definition: 'rõ ràng, minh bạch' },
            { id: 6, term: 'fundamental', pronunciation: '/ˌfʌndəˈmentəl/', definition: 'cơ bản, nền tảng' },
        ],
    },
    {
        id: 3,
        title: 'Phrasal Verbs Thông Dụng',
        description: 'Cụm động từ hay dùng trong giao tiếp',
        author: 'Bạn',
        color: '#23b26d',
        cards: [
            { id: 1, term: 'give up', definition: 'từ bỏ' },
            { id: 2, term: 'look forward', definition: 'mong chờ' },
            { id: 3, term: 'put off', definition: 'trì hoãn' },
            { id: 4, term: 'come across', definition: 'tình cờ gặp' },
            { id: 5, term: 'break down', definition: 'hỏng hóc, sụp đổ' },
            { id: 6, term: 'carry out', definition: 'thực hiện' },
        ],
    },
    {
        id: 4, title: 'Business English', description: 'Tiếng Anh trong môi trường công sở', author: 'Bạn', color: '#ff9500',
        cards: [
            { id: 1, term: 'agenda', definition: 'chương trình cuộc họp' },
            { id: 2, term: 'deadline', definition: 'hạn chót' },
            { id: 3, term: 'milestone', definition: 'cột mốc quan trọng' },
            { id: 4, term: 'stakeholder', definition: 'các bên liên quan' },
            { id: 5, term: 'benchmark', definition: 'tiêu chuẩn tham chiếu' },
        ],
    },
    {
        id: 5, title: 'Từ Vựng Học Thuật', description: 'Academic vocabulary cho nghiên cứu', author: 'Bạn', color: '#8b5cf6',
        cards: [
            { id: 1, term: 'hypothesis', definition: 'giả thuyết' },
            { id: 2, term: 'empirical', definition: 'thực nghiệm, dựa trên bằng chứng' },
            { id: 3, term: 'paradigm', definition: 'mô hình, hệ thống tư tưởng' },
            { id: 4, term: 'methodology', definition: 'phương pháp luận' },
        ],
    },
    {
        id: 6, title: 'Idioms & Expressions', description: 'Thành ngữ tiếng Anh thú vị', author: 'Bạn', color: '#0ea5e9',
        cards: [
            { id: 1, term: 'hit the nail on the head', definition: 'nói đúng vào trọng tâm' },
            { id: 2, term: 'bite the bullet', definition: 'cắn răng chịu đựng' },
            { id: 3, term: 'break a leg', definition: 'chúc may mắn' },
            { id: 4, term: 'cost an arm and a leg', definition: 'rất đắt tiền' },
            { id: 5, term: 'under the weather', definition: 'cảm thấy không khỏe' },
        ],
    },
]

export function getSetById(id: number | string): StudySet | undefined {
    return MOCK_SETS.find(s => s.id === Number(id))
}