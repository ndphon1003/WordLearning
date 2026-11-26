import LearningApp from "../../components/LearningApp";
export default async function Page({params}:{params:Promise<{view?:string[]}>}){
 const {view=[]}=await params;
 return <LearningApp view={view}/>;
}
