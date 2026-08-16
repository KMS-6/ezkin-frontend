import pytest
from httpx import AsyncClient


@pytest.fixture
async def user_id(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/users",
        json={"email": "test@example.com", "nickname": "테스터"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.fixture
async def another_user_id(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/users",
        json={"email": "other@example.com", "nickname": "다른사용자"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.fixture
async def product_id(client: AsyncClient, user_id: str) -> str:
    resp = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "테스트", "product_name": "보습 크림", "product_type": "moisturizer"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


# COSMETIC-001 (P0): 수동 등록 시 201과 user_verified_at 반환
async def test_cosmetic_001_manual_registration_returns_user_verified_at(
    client: AsyncClient, user_id: str
) -> None:
    resp = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "H사", "product_name": "저자극 진정 토너", "product_type": "toner"},
    )
    assert resp.status_code == 201
    assert resp.json()["user_verified_at"] is not None


# COSMETIC-002 (P1): 이미지 없이 텍스트만 등록 → 201
async def test_cosmetic_002_registration_without_image_succeeds(
    client: AsyncClient, user_id: str
) -> None:
    resp = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "테스트", "product_name": "세럼", "product_type": "serum"},
    )
    assert resp.status_code == 201


# COSMETIC-005 (P0): 목록 조회 - soft delete된 제품 제외 (deleted_at IS NULL)
async def test_cosmetic_005_list_excludes_soft_deleted_product(
    client: AsyncClient, user_id: str
) -> None:
    r1 = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "A", "product_name": "토너", "product_type": "toner"},
    )
    r2 = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "B", "product_name": "크림", "product_type": "moisturizer"},
    )
    await client.delete(
        f"/api/v1/shelf/products/{r1.json()['id']}",
        headers={"X-User-Id": user_id},
    )

    resp = await client.get("/api/v1/shelf/products", headers={"X-User-Id": user_id})

    assert resp.status_code == 200
    ids = [item["id"] for item in resp.json()["items"]]
    assert r1.json()["id"] not in ids
    assert r2.json()["id"] in ids


# COSMETIC-006 (P1): PATCH - 전달한 필드만 갱신, 나머지 유지
async def test_cosmetic_006_patch_updates_only_specified_field(
    client: AsyncClient, user_id: str, product_id: str
) -> None:
    resp = await client.patch(
        f"/api/v1/shelf/products/{product_id}",
        headers={"X-User-Id": user_id},
        json={"product_type": "serum"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["product_type"] == "serum"
    assert data["brand"] == "테스트"


# COSMETIC-007 (P0): DELETE → 204, soft delete (이후 목록 미포함)
async def test_cosmetic_007_delete_returns_204_and_hides_product_from_list(
    client: AsyncClient, user_id: str, product_id: str
) -> None:
    resp = await client.delete(
        f"/api/v1/shelf/products/{product_id}",
        headers={"X-User-Id": user_id},
    )
    assert resp.status_code == 204

    list_resp = await client.get("/api/v1/shelf/products", headers={"X-User-Id": user_id})
    assert list_resp.json() == {"items": []}


# COSMETIC-008 (P1): brand 미입력 → 422
async def test_cosmetic_008_missing_brand_returns_422(client: AsyncClient, user_id: str) -> None:
    resp = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"product_name": "토너", "product_type": "toner"},
    )
    assert resp.status_code == 422


# COSMETIC-009 (P1): product_name 미입력 → 422
async def test_cosmetic_009_missing_product_name_returns_422(
    client: AsyncClient, user_id: str
) -> None:
    resp = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "테스트", "product_type": "toner"},
    )
    assert resp.status_code == 422


# COSMETIC-010 (P1): PATCH brand=null → 422 (null 불허)
async def test_cosmetic_010_patch_null_brand_returns_422(
    client: AsyncClient, user_id: str, product_id: str
) -> None:
    resp = await client.patch(
        f"/api/v1/shelf/products/{product_id}",
        headers={"X-User-Id": user_id},
        json={"brand": None},
    )
    assert resp.status_code == 422


# COSMETIC-014 (P2): product_type 미정의 값 → 422
async def test_cosmetic_014_undefined_product_type_returns_422(
    client: AsyncClient, user_id: str
) -> None:
    resp = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "테스트", "product_name": "헤어크림", "product_type": "haircare"},
    )
    assert resp.status_code == 422


# COSMETIC-015 (P0) / SEC-002 (P0): XSS 페이로드 저장 시 오류 없이 처리
async def test_cosmetic_015_xss_payload_stored_without_error(
    client: AsyncClient, user_id: str
) -> None:
    xss = "<script>alert(1)</script>"
    resp = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "테스트", "product_name": xss, "product_type": "moisturizer"},
    )
    assert resp.status_code == 201
    assert resp.json()["product_name"] == xss


# COSMETIC-016 (P0) / SEC-004 (P0): 타 사용자 리소스 접근 → 404 (존재 여부 비노출)
async def test_cosmetic_016_cross_user_access_returns_404(
    client: AsyncClient, user_id: str, another_user_id: str, product_id: str
) -> None:
    resp = await client.patch(
        f"/api/v1/shelf/products/{product_id}",
        headers={"X-User-Id": another_user_id},
        json={"product_type": "serum"},
    )
    assert resp.status_code == 404


# SEC-001 (P0): SQL 인젝션 페이로드 정상 저장 (쿼리 오작동 없음)
async def test_sec_001_sql_injection_stored_without_query_error(
    client: AsyncClient, user_id: str
) -> None:
    injection = "' OR 1=1; --"
    resp = await client.post(
        "/api/v1/shelf/products",
        headers={"X-User-Id": user_id},
        json={"brand": "테스트", "product_name": injection, "product_type": "moisturizer"},
    )
    assert resp.status_code == 201
    assert resp.json()["product_name"] == injection
