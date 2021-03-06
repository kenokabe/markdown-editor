
(() => {
  const React = require("react");
  const {render} = require("react-dom");
  const {Button, Col, Row, Container} = require("reactstrap");

  const {T, now, log, mlog} = require("timeline-monoid");
  const marked = require("marked");

  const fs = require("fs");
  const util = require("util");

  const remote = require("electron").remote;
  const Dialog = remote.dialog;

  const Mark = require("mark.js");
  //=============================================
  const FRPComponent = (timeline) => {

    class Timeline extends React.Component {
      constructor() {
        super();
        this.state = {
          el: timeline[now]
        };
        const pipeline = timeline
          .sync(val => this.setState({
            el: val
          }));
      }
      render() {
        return (<span>{this.state.el}</span>);
      }
    }
    return (<Timeline/>);
  };
  //=============================================

  const fileTL = T();

  const contentLoadTL = T(timeline => {
    const pipeline = fileTL
      .sync((fileName) => {
        fs.readFile(fileName, "utf8", (err, data) => {
          timeline[now] = data;
        });
        return true;
      });
  });

  const markInstance = T();
  const countTL = T();

  const Counter = () => FRPComponent(countTL);

  const dummyTL = contentLoadTL
    .sync((data) => (markdownTL[now] = data))
    .sync(() => {
      const f = () => {
        document.getElementById("editor").scrollTop = 1;
        document.getElementById("viewer").scrollTop = 1;

        const context = document.querySelector("#viewer");
        markInstance[now] = new Mark(context);
      };

      setTimeout(f, 1000);
    });


  const searchingTL = T();
  const sTL = searchingTL
    .sync(val => search(val));

  const search = (val) => {
    markInstance[now].unmark({
      done: () => {
        markInstance[now].mark(val,
          {
            "done": (count) => {
              countTL[now] = count;
              return true;
            }
          });
      }
    });
  };


  const intervalSearchTL = T(
    (timeline) => {
      const f = () => timeline[now] = true;
      setInterval(f, 500);
    }
  );

  const pipeline1 = (intervalSearchTL)
    .sync(() => search(searchingTL[now])
  );

  /*
    const bak = searchingTL[now];
    searchingTL[now] = "!@#$%^&*123&";
    const f = () => searchingTL[now] = bak;
    setTimeout(f, 500);
  */
  const Main = () => {
    const style0 = {
      "position": "fixed",
      "width": "100%",
      "height": "100%",
      "margin": "0px",
      "padding": "0px",
      "backgroundColor": "#000000",
      "color": "white"
    };
    const styleFile = {
      "position": "fixed",
      "padding": "3px",
      "color": "white",
      "fontSize": "22px"
    };

    return (<div style={style0}>
      <Container fluid={true}>
        <Row >
      <Col sm="2" >
        <Button onClick={() => {
        Dialog.showOpenDialog(null, {
          properties: ["openFile"],
          title: "File(Single Select)",
          defaultPath: ".",
          filters: [
            {
              name: "MarkDown",
              extensions: ["md"]
            }
          ]
        }, ([fileName]) => {
          const dummy = !!(fileName)
            ? (() => fileTL[now] = fileName)()
            : false;
        });

      }} >File</Button>

      </Col>
      <Col sm="7" >
        <div style = {styleFile}>
        {FRPComponent(fileTL)}
      </div>
      </Col>
      <Col sm="2" >
        <div style = {styleFile}>
        <input
      type="text"
      onChange={(e) => searchingTL[now] = e.target.value}/>
        </div>
      </Col>
      <Col sm="1" >
      <div style = {styleFile}>
        {Counter()}
      </div>
      </Col>
      </Row>
    </Container>

      {Panes(style0)}
     </div>);
  };

  const Panes = (style0) => {
    const style1 = {
      "width": "100%",
      "height": "95%",
      "margin": "0px",
      "padding": "0px",
      "backgroundColor": "#000000"
    };
    return (
      //================
      <Container fluid={true} style={style0}>
        <Row style={style0}>
    <Col sm="6" >
      <div style={style1}>
        {Editor()}
      </div>
    </Col>
    <Col sm="6" >
     <div style={style1}>
        {Viewer()}
     </div>
    </Col>
  </Row>
</Container>
      //==================
      );
  };

  const markdownTL = T();
  const renderer = new marked.Renderer();
  marked.setOptions({
    renderer: renderer,
    pedantic: false,
    gfm: true,
    tables: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
  });

  const htmlTL = markdownTL
    .sync((text) => marked(text))
    .sync((html) => <div
      dangerouslySetInnerHTML={{
        __html: html
      }}/>);


  const autoSaveTL = T(
    (timeline) => {
      const f = () => timeline[now] = true;
      setInterval(f, 5000);
    }
  );

  const pipeline = (autoSaveTL)(markdownTL)
    .sync(() => (!!fileTL[now])
      ? (() => {
        const f = a => a; //do nothing
        fs.writeFile(fileTL[now], markdownTL[now], f);
        return true;
      })()
      : true
  );
  const a = (a) => {
    const x = 5;
    return a;
  };

  const oneSecInterval = T(
    (timeline) => {
      const f = () => timeline[now] = true;
      setInterval(f, 300);
    });
  const twoSecInterval = T(
    (timeline) => {
      const f = () => timeline[now] = true;
      setInterval(f, 1000);
    });

  const editorH = T();
  const viewerH = T();

  const scrollEditorH = T();
  const scrollViewerH = T();

  const scrollEditor = T();
  const scrollViewer = T();

  const percent = (val) => (Math.round(val * 100) / 100);

  const scrollEditorR = scrollEditor
    .sync(val => percent((val + (editorH[now] / 2))
      / scrollEditorH[now]));
  const scrollViewerR = scrollViewer
    .sync(val => percent((val + (viewerH[now] / 2))
      / scrollViewerH[now]));

  const scrollViewerTarget = (scrollEditorR)(oneSecInterval)
    .sync(([ratio, interval]) => scrollViewerH[now] * ratio
      - (viewerH[now] / 2));

  const pipleineV = scrollViewerTarget
    .sync(target => {
      document.getElementById("viewer").scrollTop = target;
    });
  const scrollEditorTarget = (scrollViewerR)(twoSecInterval)
    .sync(([ratio, interval]) => scrollEditorH[now] * ratio
      - (editorH[now] / 2));

  const pipelineE = scrollEditorTarget
    .sync(target => {
      document.getElementById("editor").scrollTop = target;
    });

  const Editor = () => FRPComponent(
    contentLoadTL
      .sync(content => {

        const contentHTML = content
          .replace(/\n/g, "<BR>");

        console.log(contentHTML);
        const onInput = (e) => {
          markdownTL[now] = e.target.innerText;
        };
        const onScroll = (e) => {
          editorH[now] = e.target.clientHeight;
          scrollEditorH[now] = e.target.scrollHeight;
          scrollEditor[now] = e.target.scrollTop ;
        };
        const style = {
          "width": "100%",
          "height": "100%",
          "padding": "15px",
          "overflow": "auto",
        };
        return (<div
          contentEditable={"plaintext-only"}
          id={"editor"}
          className={"editor"}
          style={style}
          onInput={onInput}
          onScroll={onScroll}
          dangerouslySetInnerHTML={{
            __html: contentHTML
          }}
          />);
      })
  );

  const Viewer = () => FRPComponent(
    htmlTL
      .sync(innerHTML => {
        const onScroll = (e) => {
          viewerH[now] = e.target.clientHeight;
          scrollViewerH[now] = e.target.scrollHeight;
          scrollViewer[now] = e.target.scrollTop ;
        };
        const style = {
          "width": "100%",
          "height": "100%",
          "padding": "15px",
          "overflow": "auto"
        };

        return <div
          id={"viewer"}
          className={"viewer"}
          style={style}
          onScroll={onScroll}
          >{innerHTML}</div>;
      })
  );
  //----------
  //======================================================
  render(Main(), document.getElementById("container"));

})();
