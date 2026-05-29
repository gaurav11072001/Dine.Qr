import qrcode
import os

def generate_table_qr(table_no, frontend_url, restaurant_id=None):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    qrcodes_dir = os.path.join(base_dir, 'static', 'qrcodes')
    os.makedirs(qrcodes_dir, exist_ok=True)

    # New multi-tenant URL: /menu/restaurant/:restaurantId/table/:tableNo
    if restaurant_id:
        redirect_url = f"{frontend_url.rstrip('/')}/menu/restaurant/{restaurant_id}/table/{table_no}"
        filename = f"restaurant_{restaurant_id}_table_{table_no}.png"
    else:
        redirect_url = f"{frontend_url.rstrip('/')}/menu/table/{table_no}"
        filename = f"table_{table_no}.png"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(redirect_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    filepath = os.path.join(qrcodes_dir, filename)
    img.save(filepath)

    return f"/static/qrcodes/{filename}", redirect_url
