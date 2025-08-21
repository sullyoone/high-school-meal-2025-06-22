const form = document.getElementById("mealForm");
const result = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  result.innerHTML = "불러오는 중...";

  const dateInput = document.getElementById("date").value;
  if (!dateInput) return;

  const yyyymmdd = dateInput.replaceAll("-", "");
  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530475&MLSV_YMD=${yyyymmdd}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API 요청 실패");

    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const rows = xmlDoc.getElementsByTagName("row");
    if (rows.length === 0) {
      result.innerHTML = `<p>해당 날짜(${dateInput})의 급식 정보가 없습니다.</p>`;
      return;
    }

    let html = "";
    for (let row of rows) {
      const mealType = row.getElementsByTagName("MMEAL_SC_NM")[0].textContent;
      let menu = row.getElementsByTagName("DDISH_NM")[0].textContent;
      menu = menu.replace(/<br\s*\/?>/gi, "\n");
      const menuList = menu.split("\n").map(item => `<li>${item}</li>`).join("");

      const calories = row.getElementsByTagName("CAL_INFO")[0]?.textContent || "";
      const nutrients = row.getElementsByTagName("NTR_INFO")[0]?.textContent || "";

      // 탄단지 추출
      let carb = "", protein = "", fat = "";
      if (nutrients) {
        const parts = nutrients.split(",");
        parts.forEach(p => {
          if (p.includes("탄수화물")) carb = p.trim();
          if (p.includes("단백질")) protein = p.trim();
          if (p.includes("지방")) fat = p.trim();
        });
      }

      html += `
        <div class="meal">
          <h3>${mealType}</h3>
          <ul>${menuList}</ul>
          <div class="nutrients">
            ${calories ? `<span>칼로리: ${calories}</span>` : ""}
            ${carb ? `<span>${carb}</span>` : ""}
            ${protein ? `<span>${protein}</span>` : ""}
            ${fat ? `<span>${fat}</span>` : ""}
          </div>
        </div>
      `;
    }

    result.innerHTML = html;

  } catch (err) {
    console.error(err);
    result.innerHTML = `<p style="color:red">데이터 불러오기 실패: ${err.message}</p>`;
  }
});

