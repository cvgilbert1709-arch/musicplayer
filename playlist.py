import os
import json
import subprocess

def generate_playlist():
    # 目前 Python 檔案所在的資料夾路徑 (C:\\Users\\cvgil\\Downloads\\my-music-pwa)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 定義音樂檔案實際存放的子資料夾路徑 (C:\\Users\\cvgil\\Downloads\\my-music-pwa\\song)
    song_dir = os.path.join(current_dir, 'song')
    
    # 如果找不到 song 資料夾，自動建立一個
    if not os.path.exists(song_dir):
        os.makedirs(song_dir)
        print(f"📁 找不到 'song' 資料夾，已為您自動建立。請把 MP3 放進：{song_dir}")
        return False
        
    playlist = []
    
    print(f"🎵 1. 開始掃描 {song_dir} 內的音樂檔案...")
    # 掃描 song 子資料夾內的所有檔案
    for filename in os.listdir(song_dir):
        if filename.lower().endswith('.mp3'):
            name_without_ext = os.path.splitext(filename)[0]
            
            # 根據 " - " 拆分歌手與歌名
            if " - " in name_without_ext:
                parts = name_without_ext.split(" - ", 1)
                artist = parts[0].strip()
                title = parts[1].strip()
            else:
                artist = "未知歌手"
                title = name_without_ext.strip()
            
            # 💡 【關鍵修改】：因為音樂在子資料夾，網頁讀取的相對路徑必須補上 "song/"
            song_file_path = f"song/{filename}"
            
            song_data = {
                "title": title,
                "file": song_file_path,  # 例如 "song/周傑倫 - 晴天.mp3"
                "artist": artist
            }
            playlist.append(song_data)
    
    # 按照歌名排序
    playlist.sort(key=lambda x: x['title'])
    
    # 將 playlist.json 寫回主資料夾中
    output_path = os.path.join(current_dir, 'playlist.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(playlist, f, ensure_ascii=False, indent=2)
        
    print(f"✅ 歌單更新成功！共包含 {len(playlist)} 首歌曲。")
    return True

def upload_to_github():
    print("\n🚀 2. 開始自動上傳到 GitHub...")
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(current_dir)
        print(current_dir)

        # 執行 git 指令（會自動包含主資料夾變更與 song 資料夾內的新歌）
        subprocess.run(["git", "add", "."], check=True)
        
        commit_message = "🤖 Auto-updated playlist and uploaded new songs from song/ folder"
        subprocess.run(["git", "commit", "-m", commit_message], check=True)
        
        subprocess.run(["git", "push", "origin", "main"], check=True)
        
        print("\n🎉 大功告成！所有檔案（包含 song 內的新歌）已成功上傳至 GitHub！")
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Git 上傳失敗！錯誤代碼: {e.returncode}")
        print("請確保您這台電腦平時可以使用 git 指令直接 push 而不需要密碼。")
    except Exception as e:
        print(f"\n❌ 發生未知錯誤: {e}")

if __name__ == "__main__":
    success = generate_playlist()
    if success and len(os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'song'))) > 0:
        upload_to_github()
    else:
        print("\n⚠️ 您的 song 資料夾內似乎沒有任何 MP3 檔案，已跳過 GitHub 上傳。")
