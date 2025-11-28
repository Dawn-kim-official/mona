-- donation_matches 테이블에 후기 파일 관련 컬럼 추가

ALTER TABLE donation_matches
ADD COLUMN IF NOT EXISTS review_file_url TEXT,
ADD COLUMN IF NOT EXISTS review_uploaded_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN donation_matches.review_file_url IS '후기 문서 파일 URL (PDF, DOCX 등)';
COMMENT ON COLUMN donation_matches.review_uploaded_at IS '후기 업로드일';

SELECT 'Review file columns added successfully' as status;
