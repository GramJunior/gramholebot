// Реклама Adsgram (v39.4): вставьте id блока Rewarded из partner.adsgram.ai (например '12345') — и всё. Пусто — рекламы нет.
// id блока не секрет (он всё равно виден в коде страницы). Interstitial — по желанию (например 'int-12345'). Подробно: README «Реклама Adsgram (v39.4)».
// ?ads=dev в адресе или ссылка t.me/emberveil_game_bot/play?startapp=adsdev — тестовая площадка Adsgram (показы не засчитываются), иначе боевой блок.
window.EV_ADS_BLOCK = window.EV_ADS_BLOCK || ((/[?&]ads=dev\b/.test(location.search) || /tgWebAppStartParam=adsdev\b/.test(location.hash + location.search)) ? '59275' : '59265'); window.EV_ADS_BLOCK_INT = window.EV_ADS_BLOCK_INT || '';
