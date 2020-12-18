import { NestedTreeControl } from '@angular/cdk/tree';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { CodeEditorService, CodeModel } from '@ngstack/code-editor';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { FileDatabase } from './file-database';
import { FileNode, FileNodeType } from './file-node';

@Component({
  selector: 'app-code-editor-demo',
  templateUrl: './code-editor-demo.component.html',
  styleUrls: ['./code-editor-demo.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [FileDatabase],
})
export class CodeEditorDemoComponent implements OnInit {
  nestedTreeControl: NestedTreeControl<FileNode>;
  nestedDataSource: MatTreeNestedDataSource<FileNode>;

  themes = [
    { name: 'Visual Studio', value: 'vs' },
    { name: 'Visual Studio Dark', value: 'vs-dark' },
    { name: 'High Contrast Dark', value: 'hc-black' },
  ];

  selectedModel: CodeModel = null;
  activeTheme = 'vs-dark';
  readOnly = false;
  isLoading = false;
  isLoading$: Observable<boolean>;

  @ViewChild('file')
  fileInput: ElementRef;

  options = {
    contextmenu: true,
    minimap: {
      enabled: false,
    },
  };

  /*************** */

  myControl = new FormControl();
  optionsArr: string[] = ['One', 'Two', 'Three'];
  filteredOptions: Observable<string[]>;
  ruleSetTypesOptions: Observable<string[]>;

  ruleForm: FormGroup;
  sourceCode = ['// JScript source code'];
  funcParams: string[] = ['param', 'Source', 'RefSourceName', 'ObjectName', 'RuleStr', 'TocID', 'SourceName', 'Rule', 'xmlString'];
  actionsArr: string[] = ['Read From Source', 'Read Shape File', 'Inset Log'];
  showFilePath = false;



  ruleSetTypes: string[] = ['Completeness', 'Correction', 'Data Changed', 'Validity'];
  dataTypes: string[] = ['WellBore', 'Dev Survey', 'Log Curve'];
  attributes: string[] = ['UWI', 'Elevation', 'Spud Date', 'Surface Location', 'Bottom Hole Location'];
  actions = [{
    name: 'Comparision Operations',
    actions: [
      { value: '==', viewValue: '==' },
      { value: '>=', viewValue: '>=' },
      { value: '>', viewValue: '>' },
      { value: '<=', viewValue: '<=' },
      { value: '<', viewValue: '<' }
    ]
  }]






  /****************** */

  constructor(database: FileDatabase, editorService: CodeEditorService) {
    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();

    database.dataChange.subscribe(
      (data) => (this.nestedDataSource.data = data)
    );

    this.isLoading$ = editorService.loadingTypings.pipe(debounceTime(300));
  }

  hasNestedChild(_: number, nodeData: FileNode): boolean {
    return nodeData.type === FileNodeType.folder;
  }

  private _getChildren = (node: FileNode) => node.children;

  onCodeChanged(value) {
    this.sourceCode = value.split('\n');
    console.log(this.sourceCode)
  }

  isNodeSelected(node: FileNode): boolean {
    return (
      node &&
      node.code &&
      this.selectedModel &&
      node.code === this.selectedModel
    );
  }

  selectNode(node: FileNode) {
    this.isLoading = false;
    console.log(node);
    this.selectedModel = node.code;
  }

  ngOnInit() {

    this.selectedModel = {
      language: 'javascript',
      uri: 'main.js',
      value: this.sourceCode.join('\n')
    };

    /******************* */

    this.createFrom();

    // this.filteredOptions = this.ruleForm.get('action').valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(this.actionsArr, value))
    // );


    this.ruleSetTypesOptions = this.ruleForm.get('ruleSetType').valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ruleSetTypes, value))
    );

  }

  onEditorLoaded() {
    console.log('loaded');
  }

  /***************************** */
  private _filter(Arr, value: string): string[] {
    const filterValue = value.toLowerCase();

    return Arr.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  createFrom() {
    this.ruleForm = new FormGroup({
      ruleSetType: new FormControl(''),
      funcName: new FormControl(''),
      dataSource: new FormControl(''),
      action: new FormControl(),
      staticValue: new FormControl(),



      params: new FormControl(),

      filePath: new FormControl(),
      dataType: new FormControl(''),
    });
  }

  updateCode() {

    this.selectedModel = {
      language: 'javascript',
      uri: 'main.js',
      value: this.sourceCode.join('\n')
    };

  }

  createFunction() {
    console.log(this.ruleForm.value.funcName);
    this.selectedModel.value = this.ruleForm.value.funcName;

    this.sourceCode.push(
      `function ${this.ruleForm.value.funcName}(ObjectName,TocID,SourceName,RefSourceName,Rule,xmlString){`,

      '}'
    );

    this.updateCode();
  }

  pressEnter(event) {
    // if (event.charCode === 13) {
    //   this.createFunction();
    // }

  }

  paramsSelected(event) {
    this.sourceCode[1] = `function ${this.ruleForm.value.funcName}(${event.value.join(',')}){`
    this.updateCode();
  }

  checkForInit() {
    let fountAt = -1;
    this.sourceCode.forEach((line, index) => {
      if (line.indexOf('function Init(') > -1) {
        fountAt = index;
      }
    });
    if (fountAt === -1) {
      this.sourceCode.forEach((line, index) => {
        if (line.indexOf('function') > -1) {
          fountAt = index;
        }
      });

      this.sourceCode.splice(fountAt, 0, 'function Init(){', '}');
      this.updateCode();
    }
    fountAt++;
    return fountAt;
  }

  addLogActiveX() {
    if (this.sourceCode.indexOf('var g_ASILog;') === -1) {
      this.sourceCode.splice(1, 0, 'var g_ASILog;');
      const foundAt = this.checkForInit();
      this.sourceCode.splice(foundAt, 0, ' g_ASILog = new ActiveXObject("ILXDisp.ILXLog");');
    }
  }

  // actionSelected(event) {
  //   const opt = event.option.value;
  //   if (opt === 'Read From Source') {

  //     if (this.sourceCode.indexOf('var g_xmlDoc;') === -1) {
  //       this.sourceCode.splice(1, 0, 'var g_xmlDoc;');
  //       const foundAt = this.checkForInit();
  //       this.sourceCode.splice(foundAt, 0, ' g_xmlDoc = new ActiveXObject("Msxml2.DOMDocument");', ' g_xmlDoc.async = false;');
  //     }

  //   }

  //   if (opt === 'Read Shape File') {
  //     this.showFilePath = true;
  //   }

  //   if (opt === 'Inset Log') {
  //     this.addLogActiveX();
  //   }

  //   this.updateCode();

  // }

  filePathAded() {
    if (this.sourceCode.indexOf('var g_ilxCntyShapeFile;') === -1) {

      this.sourceCode.splice(1, 0, `var filePath =  '${this.ruleForm.value.filePath}';`);
      this.sourceCode.splice(1, 0, 'var g_ilxCntyShapeFile;');
      const foundAt = this.checkForInit();
      this.sourceCode.splice(
        foundAt,
        0,
        ' var FileErr',
        ' g_ilxCntyShapeFile = new ActiveXObject("ILXDisp.ILXShape");',
        ' FileErr = g_ilxCntyShapeFile.Open(filePath,"r");',
        ' if( FileErr ){',
        '  g_ASILog.print(0,"[SCRIPT ERROR]Failed to open County shape file.  Check path in script file.");',
        '  g_ilxCntyShapeFile = null;',
        ' }'
      );

      this.addLogActiveX();
    }
    this.updateCode();
  }


  dataSourceAdded() {
    this.sourceCode.splice(
      1,
      0,
      'var g_ASILog;',
      'var g_xmlDoc;',
      `var g_Source = '${this.ruleForm.value.dataSource}';`);
    const foundAt = this.checkForInit();
    this.sourceCode.splice(
      foundAt,
      0,
      ' g_ASILog = new ActiveXObject("ILXDisp.ILXLog");',
      ' g_xmlDoc = new ActiveXObject("Msxml2.DOMDocument");',
      ' g_xmlDoc.async = false;'
    );
    this.updateCode();
  }

  dataTypeSelected() {

  }

  findMainFunction() {
    let fountAt = -1;
    this.sourceCode.forEach((line, index) => {
      if (line.indexOf(`function ${this.ruleForm.value.funcName}`) > -1) {
        fountAt = index;
      }
    });

    return fountAt;
  }

  attributesSelected() {
    this.sourceCode.splice(
      this.findMainFunction(),
      0,
      `function GetElevation(refName, elevTagName) {
        var newElev, Elev, ElevRef;
        newElev = "";
        Elev = "";
        ElevRef = "";



        var tempNode = g_xmlDoc.selectSingleNode("//WellBore/Elevation");
        if (tempNode != null && tempNode.text != '-99999') {
          ElevRef = tempNode.getAttribute("Ref");
          if (ElevRef != "") {
            Elev = parseFloat(tempNode.text);
            if (ElevRef == refName)
              newElev = Elev;
          }
        }

        if (newElev == "") {
          var aPath = "//WellBore/" + elevTagName;
          tempNode = g_xmlDoc.selectSingleNode(aPath);
          if (tempNode != null && tempNode.text != '-99999' && tempNode.text != "")
            newElev = parseFloat(tempNode.text);
        }
        return newElev;
      }​​`

    );
    this.updateCode();

  }


  actionSelected() {

  }

  staticValueAdded() {

    console.log(this.ruleForm.value)

    this.sourceCode.splice(
      this.findMainFunction() + 1,
      0,
      ` g_ASILog.print(2, "[${this.ruleForm.value.funcName}] Starting Rule");

        g_xmlDoc.loadXML(xmlString);
        if (g_xmlDoc.parseError.errorCode > 0) {
          var myErr = g_xmlDoc.parseError;
          g_ASILog.print(0, "[ERROR] ${this.ruleForm.value.funcName} - Parse Error=" + myErr);
          return (-1);
        }

        var strUWI = "";
        var tempNode = g_xmlDoc.selectSingleNode("//WellBore/UWI");
        if (tempNode != null)
          strUWI = tempNode.text;

        kbElev = GetElevation("KB", "KBElevation");
          if (kbElev == ""){
            g_ASILog.print(2,"[${this.ruleForm.value.funcName}] UWI=" + strUWI + ", KBElevation null, skipping rule");
            return (-1);
          }

          if (kbElev ${this.ruleForm.value.action} ${this.ruleForm.value.staticValue}){
            g_ASILog.print(2,"[${this.ruleForm.value.funcName}] UWI=" + strUWI + ", KB ${this.ruleForm.value.action} ${this.ruleForm.value.staticValue}, passed rule");
            return (0);
          }else{
            g_ASILog.print(2,"[${this.ruleForm.value.funcName}] UWI=" + strUWI + ", KB ! ${this.ruleForm.value.action} ${this.ruleForm.value.staticValue}, failed rule");
            return (1);
          }
          `
    );
    this.updateCode();




  }
}


