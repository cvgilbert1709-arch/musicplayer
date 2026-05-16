import os
import json
import subprocess

def generate_playlist():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    song_dir = os.path.join(current_dir, 'song')
    
    if not os.path.exists(song_dir):
        os.makedirs(song_dir)
        print(f"📁 找不到 'song' 資料夾，已自動建立。請把 MP3 放進：{song_dir}")
        return False
        
    playlist = []
    print(f"🎵 1. 開始掃描 {song_dir} 內的所有 MP3 檔案...")
    
    for filename in os.listdir(song_dir):
        if filename.lower().endswith('.mp3'):
            pure_name = filename[:-4] if filename.lower().endswith('.mp3') else filename
            
            if " - " in pure_name:
                parts = pure_name.split(" - ", 1)
                artist = parts[0].strip()
                title = parts[1].strip()
            else:
                artist = "未知歌手"
                title = pure_name.strip()
            
            song_file_path = f"song/{filename}"
            
            playlist.append({
                "title": title,
                "file": song_file_path,
                "artist": artist
            })
    
    playlist.sort(key=lambda x: x['title'])
    
    output_path = os.path.join(current_dir, 'playlist.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(playlist, f, ensure_ascii=False, indent=2)
        
    print(f"✅ 歌單更新成功！共包含 {len(playlist)} 首歌曲。")
    return True

def upload_to_github():
    print("\n🚀 2. 啟動一鍵同步，自動上傳至 GitHub...")
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(current_dir)

        # 💡【終極硬派路徑修正】：直接指定 Windows 預設的 Git 安裝路徑（前面加 r 防止斜線出錯）
        git_path = r"C:\Program Files\Git\cmd\git.exe"
        
        # 如果你把 Git 裝在其他非預設的地方，導致找不到，我們可以用第二路徑防呆
        if not os.path.exists(git_path):
            git_path = "git" # 真的找不到才退回讓系統自己猜

        # 1. 自動打包檔案 (直接帶入 git_path)
        add_result = subprocess.run(f'"{git_path}" add .', shell=True, capture_output=True, text=True, encoding='cp950', errors='ignore')
        
        if add_result.returncode != 0:
            print("\n🔍 【偵錯回報】Git 拒絕打包檔案！以下是 Windows Git 回傳的真實原因：")
            print("==================================================")
            print(add_result.stderr.strip() if add_result.stderr else "未知 Git 錯誤")
            print("==================================================")
            return

        # 2. 檢查變更
        status_check = subprocess.run(f'"{git_path}" status --porcelain', shell=True, capture_output=True, text=True, encoding='cp950', errors='ignore')
        
        if not status_check.stdout.strip():
            print("\nℹ️ 檢查完畢：專案沒有任何新變更或新歌，跳過上傳。")
            print("🎉 音樂盒目前已經是最新的版本！")
            return

        # 3. 本地提交
        commit_message = "Automated music player update"
        subprocess.run(f'"{git_path}" commit -m "{commit_message}"', shell=True, check=True, encoding='cp950', errors='ignore')
        
        # 4. 推送到 GitHub 雲端
        subprocess.run(f'"{git_path}" push origin main', shell=True, check=True, encoding='cp950', errors='ignore')
        
        print("\n🎉 大功告成！新歌和歌單已直接同步上傳至 GitHub 倉庫！")
        print("💡 提醒：GitHub Pages 需要大約 1 分鐘更新。隨後在 iPhone 上徹底關閉並重開 App 兩次即可看到新歌！")
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Git 自動上傳失敗，錯誤代碼: {e.returncode}")
    except Exception as e:
        print(f"\n❌ 發生未知錯誤: {e}")

if __name__ == "__main__":
    if generate_playlist():
        upload_to_github()
