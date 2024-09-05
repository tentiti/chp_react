import React from 'react';
import './Invitation.css';

function Invitation() {

  return (
    <div className="background-wrapper">
      <div className="background"></div>

      <header>
        <div className="titleArea">
        <div>
            <img
              src="/static/icons/back_double.png"
              alt="back"
              id="back-button"
              onClick={() => window.history.back()}
              style={{ filter: 'brightness(0) invert(1)' }} // Applies a white color effect
            />
          </div>
          <div style={{ fontSize: '20px'}}>춤 이야기</div>
          <div></div>
        </div>
      </header>

      <div id="inv_text">
        사회는 눈에 보이는, 보이지 않는<br />
        권력 관계와 규칙들로 이루어져 있다.<br /><br />

        국가들 사이 뿐만 아니라 그 너머까지<br />
        우리의 삶과 세계에 영향을 미친다.<br /><br />

        ｢만월댄스(2019)｣는<br />
        어느 달이 밝은 밤, 슬리퍼를 신은 여성이<br />
        단독 주택의 2층 옥상에서 춤을 추는 모습을 담고 있다.<br /><br />

        ‘춤’과 ‘집’은 여성에게 어떤 의미일까?<br />
        여성은 해방의 춤을 추고, 집은 그 대상이 된다.<br />
        차오른 만월은 때가 되었음을 알린다.<br /><br />

        이는 각자의 '우리 집'이<br />
        가부장적이고 차별적인 현장의 시작이 됨을 말한다.<br /><br />

        이러한 규칙들은 오랜 시간 동안 뿌리내려<br />
        같은 문법으로<br />
        기후위기, 전쟁, 그리고 폭력적인 세상을 만들고 있다.<br /><br />

        작가 김화순의 그림 속 '춤'은 제도와 속박에 분노하는 저항,<br />
        동시에 연대하는 희망을 의미한다.<br />
        새로운 사회를 바라기에 그 현장 위에 바로 서 춤을 춘다.<br /><br />

        이 춤을 함께 추자고,<br />
        함께 살 수 있는 평화를 찾자고<br />
        당신에게 손을 내민다.<br />
        이제는 우리의 때가 되었다.

        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />

      <div className="blur-overlay"></div>
      </div>



      <div id="letsmakedance">
        <a href="/GlbTest" className="ajax-link" id="letsmakedancebutton">
          캐릭터 생성하기
        </a>
      </div>
    </div>
  );
}

export default Invitation;
