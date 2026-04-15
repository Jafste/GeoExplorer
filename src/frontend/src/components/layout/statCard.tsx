// StatCard.jsx
type Props = {
  icon: any;
  value?: number;
  label?: string;
};

export default function StatCard(props: Props) {
  return (
    <div className="p-4 md:w-1/4 sm:w-1/2 w-full">
      <div className="border-2 border-gray-600 px-4 py-6 rounded-lg transform transition duration-500 hover:scale-110 text-center">
        <div className="w-12 h-12 mb-3 inline-block text-indigo-500">
          {props.icon}
        </div>

        <h2 className="title-font font-medium text-3xl text-gray-900">
          {props.value}
        </h2>
        <p className="leading-relaxed">{props.label}</p>
      </div>
    </div>
  );
}